import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  SerialNumberAaBaseInfo,
  SerialNumberDataService,
  SerialNumberMaterialInfo,
} from 'src/serial-number-data/serial-number-data.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SnType } from 'src/utils/sn';
import { ProductOrigin } from 'src/common/enums/product-origin.enum';

export interface TraceabilitySerialNumber {
  serialNumber: string;
  type: SnType;
}


export interface TraceabilityMaterialCodeResponse {
  serialNumber: string;
  workOrderCode: string | null;
  materialCode: string | null;
}

export interface TraceabilityBaseOption {
  label: string;
  value: string | null;
}

export interface TraceabilityProcessStepSummary {
  stageCode: string;
  processName: string | null;
  stageName: string | null;
  stepTypeNo: string;
}

export interface TraceabilityFlowSummary extends TraceabilitySerialNumber {
  workOrderCode: string | null;
  flowCode: string | null;
  steps: TraceabilityProcessStepSummary[];
}

export interface TraceabilityBaseResponse {
  base: TraceabilityBaseOption[];
  flow: TraceabilityFlowSummary | null;
}

export interface TraceabilityProcessStepData {
  stepTypeNo: string;
  data: SerialNumberAaBaseInfo[];
}

interface WorkOrderContext {
  workOrderCode: string;
  client: PrismaClient;
}

interface FlowContext {
  flowCode: string;
  client: PrismaClient;
}

type ProcessFlowRecord = Awaited<
  ReturnType<PrismaClient['mo_process_flow']['findMany']>
>[number];

type ProcessFlowWithStage = Array<
  ProcessFlowRecord & {
    mo_workstage?: {
      stage_name: string | null;
      step_type_no: string | null;
    } | null;
  }
>;

interface TraceabilityFlowContext extends TraceabilitySerialNumber {
  workOrderCode: string | null;
  flowCode: string | null;
  client: PrismaClient | null;
  steps: ProcessFlowWithStage;
}

@Injectable()
export class TraceabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serialNumberDataService: SerialNumberDataService,
  ) {}

async getMaterialCode(
    serialNumber: string,
  ): Promise<TraceabilityMaterialCodeResponse> {
    const normalizedSerialNumber = serialNumber?.trim();
    if (!normalizedSerialNumber) {
      throw new BadRequestException('serialNumber is required');
    }

    const workOrderCode = await this.findWorkOrderCodeBySerialNumber(
      normalizedSerialNumber,
    );
    if (!workOrderCode) {
      return {
        serialNumber: normalizedSerialNumber,
        workOrderCode: null,
        materialCode: null,
      };
    }

    const orderInfo = await this.prisma.mo_produce_order.findFirst({
      where: { work_order_code: workOrderCode },
      select: { material_code: true },
    });
    
    return {
      serialNumber: normalizedSerialNumber,
      workOrderCode,
      materialCode: orderInfo?.material_code?.trim() || null,
    };
  }

  private async findWorkOrderCodeBySerialNumber(
    serialNumber: string,
  ): Promise<string | null> {
    const normalizedSerialNumber = serialNumber.trim();

    const beamRecord = await this.prisma.mo_beam_info.findFirst({
      where: { beam_sn: normalizedSerialNumber },
      select: { work_order_code: true },
    });
    const beamWorkOrder = beamRecord?.work_order_code?.trim();
    if (beamWorkOrder) {
      return beamWorkOrder;
    }

    const tagRecord = await this.prisma.mo_tag_info.findFirst({
      where: { tag_sn: normalizedSerialNumber },
      select: { work_order_code: true },
    });
    const tagWorkOrder = tagRecord?.work_order_code?.trim();
    if (tagWorkOrder) {
      return tagWorkOrder;
    }

    const shellLink = await this.prisma.mo_tag_shell_info.findFirst({
      where: { shell_sn: normalizedSerialNumber },
      orderBy: { id: 'desc' },
      select: { camera_sn: true },
    });
    const relatedCameraSn = shellLink?.camera_sn?.trim();
    if (relatedCameraSn) {
      const relatedBeam = await this.prisma.mo_beam_info.findFirst({
        where: { beam_sn: relatedCameraSn },
        select: { work_order_code: true },
      });
      const relatedBeamOrder = relatedBeam?.work_order_code?.trim();
      if (relatedBeamOrder) {
        return relatedBeamOrder;
      }
    }

    const cameraLink = await this.prisma.mo_tag_shell_info.findFirst({
      where: { camera_sn: normalizedSerialNumber },
      orderBy: { id: 'desc' },
      select: { shell_sn: true },
    });
    const relatedShellSn = cameraLink?.shell_sn?.trim();
    if (relatedShellSn) {
      const relatedTag = await this.prisma.mo_tag_info.findFirst({
        where: { tag_sn: relatedShellSn },
        select: { work_order_code: true },
      });
      const relatedTagOrder = relatedTag?.work_order_code?.trim();
      if (relatedTagOrder) {
        return relatedTagOrder;
      }
    }

    return null;
  }

  async getBaseInformation(
    serialNumber: string,
    processCode?: string,
  ): Promise<TraceabilityBaseResponse> {
    const normalizedSerialNumber = serialNumber?.trim();
    if (!normalizedSerialNumber) {
      throw new BadRequestException('serialNumber is required');
    }

    const normalizedProcessCode = processCode?.trim() || undefined;

    const serialNumbers = await this.resolveSerialNumbers(
      normalizedSerialNumber,
    );

    const contexts: TraceabilityFlowContext[] = [];
    for (const entry of serialNumbers) {
      contexts.push(
        await this.resolveFlowContext(entry, normalizedProcessCode),
      );
    }

    const flowContext = this.selectPrimaryFlowContext(contexts);

    return {
      base: this.buildBaseInformation(flowContext),
      flow: this.createFlowSummary(flowContext),
    };
  }

  async getMaterials(
    serialNumber: string,
  ): Promise<SerialNumberMaterialInfo[]> {
    const normalizedSerialNumber = serialNumber?.trim();
    if (!normalizedSerialNumber) {
      throw new BadRequestException('serialNumber is required');
    }

    return this.serialNumberDataService.getMaterialsBySerialNumber(
      normalizedSerialNumber,
    );
  }

  async getProcessData(
    serialNumber: string,
    stepTypeNo: string,
    processCode?: string,
  ): Promise<TraceabilityProcessStepData> {
    const normalizedSerialNumber = serialNumber?.trim();
    if (!normalizedSerialNumber) {
      throw new BadRequestException('serialNumber is required');
    }

    const normalizedStepTypeNo = stepTypeNo?.trim();
    if (!normalizedStepTypeNo) {
      throw new BadRequestException('stepTypeNo is required');
    }

    const normalizedProcessCode = processCode?.trim() || undefined;

    const serialNumbers = await this.resolveSerialNumbers(
      normalizedSerialNumber,
    );
    const contexts: TraceabilityFlowContext[] = [];
    for (const entry of serialNumbers) {
      contexts.push(
        await this.resolveFlowContext(entry, normalizedProcessCode),
      );
    }

    const flowContext = this.selectPrimaryFlowContext(contexts);
    if (!flowContext) {
      return { stepTypeNo: normalizedStepTypeNo, data: [] };
    }

    const matchingStep = flowContext.steps.find((candidate) => {
      const candidateStepTypeNo =
        candidate.mo_workstage?.step_type_no?.trim() ?? '';
      return candidateStepTypeNo === normalizedStepTypeNo;
    });

    if (!matchingStep) {
      return { stepTypeNo: normalizedStepTypeNo, data: [] };
    }

    const resolvedStepTypeNo =
      matchingStep.mo_workstage?.step_type_no?.trim() ?? normalizedStepTypeNo;

    const data =
      await this.serialNumberDataService.getProcessDataBySerialNumber(
        flowContext.serialNumber,
        resolvedStepTypeNo,
      );
    return {
      stepTypeNo: resolvedStepTypeNo,
      data,
    };
  }

  private async resolveFlowContext(
    entry: TraceabilitySerialNumber,
    providedFlowCode?: string,
  ): Promise<TraceabilityFlowContext> {
    const workOrderContext = await this.getWorkOrderContext(
      entry.serialNumber,
      entry.type,
    );

    const workOrderCode = workOrderContext?.workOrderCode ?? null;
    let flowCode = providedFlowCode ?? null;
    let preferredClient: PrismaClient | null = workOrderContext?.client ?? null;

    if (!flowCode && workOrderContext) {
      const flowContext = await this.getFlowCode(
        workOrderContext.workOrderCode,
        preferredClient,
      );
      if (flowContext) {
        flowCode = flowContext.flowCode;
        preferredClient = flowContext.client;
      }
    }

    if (!flowCode) {
      return {
        ...entry,
        workOrderCode,
        flowCode: null,
        client: preferredClient,
        steps: [],
      };
    }

    const processStepsContext = await this.findProcessSteps(
      flowCode,
      preferredClient,
    );

    const steps = processStepsContext?.steps ?? [];
    const client = processStepsContext?.client ?? preferredClient ?? null;

    return { ...entry, workOrderCode, flowCode, client, steps };
  }

  private selectPrimaryFlowContext(
    contexts: TraceabilityFlowContext[],
  ): TraceabilityFlowContext | null {
    if (!contexts || contexts.length === 0) {
      return null;
    }

    const withSteps = contexts.find((candidate) => candidate.steps.length > 0);
    if (withSteps) {
      return withSteps;
    }

    const withFlowCode = contexts.find((candidate) => candidate.flowCode);
    if (withFlowCode) {
      return withFlowCode;
    }

    return contexts[0] ?? null;
  }

  private buildBaseInformation(
    flow: TraceabilityFlowContext | null,
  ): TraceabilityBaseOption[] {
    return [
      {
        label: '工单号',
        value: this.normalizeBaseValue(flow?.workOrderCode ?? null),
      },
    ];
  }

  private createFlowSummary(
    context: TraceabilityFlowContext | null,
  ): TraceabilityFlowSummary | null {
    if (!context) {
      return null;
    }

    const steps: TraceabilityProcessStepSummary[] = context.steps
      .map((step) => ({
        stageCode: step.stage_code,
        processName: step.process_name ?? null,
        stageName: step.mo_workstage?.stage_name ?? null,
        stepTypeNo: step.mo_workstage?.step_type_no?.trim() ?? '',
      }))
      .filter((step) => step.stepTypeNo);

    return {
      serialNumber: context.serialNumber,
      type: context.type,
      workOrderCode: context.workOrderCode,
      flowCode: context.flowCode,
      steps,
    };
  }

  private normalizeBaseValue(value?: string | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private async resolveSerialNumbers(
    serialNumber: string,
  ): Promise<TraceabilitySerialNumber[]> {
    const entries: TraceabilitySerialNumber[] = [];
    const seen = new Set<string>();

    const pushUnique = (value: string | null | undefined, type: SnType) => {
      if (!value || seen.has(value)) {
        return;
      }
      seen.add(value);
      entries.push({ serialNumber: value, type });
    };

    const beamContext = await this.findFirstAcrossClients((client) =>
      client.mo_beam_info.findFirst({
        where: { beam_sn: serialNumber },
      }),
    );

    if (beamContext?.record) {
      pushUnique(serialNumber, SnType.BEAM);
      const related = await this.findFirstAcrossClients((client) =>
        client.mo_tag_shell_info.findFirst({
          where: { camera_sn: serialNumber },
          orderBy: { id: 'desc' },
        }),
      );
      pushUnique(related?.record?.shell_sn, SnType.SHELL);
    } else {
      pushUnique(serialNumber, SnType.SHELL);
      const related = await this.findFirstAcrossClients((client) =>
        client.mo_tag_shell_info.findFirst({
          where: { shell_sn: serialNumber },
          orderBy: { id: 'desc' },
        }),
      );
      pushUnique(related?.record?.camera_sn, SnType.BEAM);
    }

    return entries;
  }

  private async getWorkOrderContext(
    serialNumber: string,
    type: SnType,
  ): Promise<WorkOrderContext | null> {
    if (type === SnType.BEAM) {
      const beamContext = await this.findFirstAcrossClients((client) =>
        client.mo_beam_info.findFirst({
          where: { beam_sn: serialNumber },
        }),
      );

      if (beamContext?.record?.work_order_code) {
        return {
          workOrderCode: beamContext.record.work_order_code,
          client: beamContext.client,
        };
      }

      return null;
    }

    const tagContext = await this.findFirstAcrossClients((client) =>
      client.mo_tag_info.findFirst({
        where: { tag_sn: serialNumber },
      }),
    );

    if (tagContext?.record?.work_order_code) {
      return {
        workOrderCode: tagContext.record.work_order_code,
        client: tagContext.client,
      };
    }

    return null;
  }

  private async getFlowCode(
    workOrderCode: string,
    preferredClient?: PrismaClient | null,
  ): Promise<FlowContext | null> {
    const orderContext = await this.findFirstAcrossClients(
      (client) =>
        client.mo_produce_order.findFirst({
          where: { work_order_code: workOrderCode },
        }),
      preferredClient,
    );

    if (orderContext?.record?.flow_code) {
      return {
        flowCode: orderContext.record.flow_code,
        client: orderContext.client,
      };
    }

    return null;
  }

  private async findProcessSteps(
    flowCode: string,
    preferredClient?: PrismaClient | null,
  ): Promise<{ client: PrismaClient; steps: ProcessFlowWithStage } | null> {
    for (const client of this.getPrismaClients(preferredClient)) {
      const steps = await client.mo_process_flow.findMany({
        where: { process_code: flowCode },
        include: { mo_workstage: true },
        orderBy: { id: 'asc' },
      });

      if (steps.length > 0) {
        return { client, steps };
      }
    }

    return null;
  }

  private async findFirstAcrossClients<T>(
    finder: (client: PrismaClient) => Promise<T | null | undefined>,
    preferredClient?: PrismaClient | null,
  ): Promise<{ client: PrismaClient; record: T } | null> {
    for (const client of this.getPrismaClients(preferredClient)) {
      const record = await finder(client);
      if (record != null) {
        return { client, record };
      }
    }

    return null;
  }

  private getPrismaClients(
    preferredClient?: PrismaClient | null,
  ): PrismaClient[] {
    const clients: PrismaClient[] = [];
    const pushUnique = (client: PrismaClient | null | undefined) => {
      if (!client) {
        return;
      }
      if (!clients.includes(client)) {
        clients.push(client);
      }
    };

    pushUnique(preferredClient ?? null);
    pushUnique(this.prisma);

    for (const origin of [ProductOrigin.SUZHOU, ProductOrigin.MIANYANG]) {
      pushUnique(this.prisma.getClientByOrigin(origin));
    }

    return clients;
  }
}
