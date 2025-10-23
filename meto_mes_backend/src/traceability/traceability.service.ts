import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  SerialNumberAaBaseInfo,
  SerialNumberDataService,
} from 'src/serial-number-data/serial-number-data.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SnType } from 'src/utils/sn';
import { ProductOrigin } from 'src/common/enums/product-origin.enum';

export interface TraceabilitySerialNumber {
  serialNumber: string;
  type: SnType;
}

export interface TraceabilityProcessStep {
  stageCode: string;
  processName: string | null;
  stageName: string | null;
  stepTypeNo: string;
  data: SerialNumberAaBaseInfo[];
}

export interface TraceabilityFlow extends TraceabilitySerialNumber {
  workOrderCode: string | null;
  flowCode: string | null;
  steps: TraceabilityProcessStep[];
}

export interface TraceabilityResponse {
  base:
  materials: 
  flow: TraceabilityFlow;
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

@Injectable()
export class TraceabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serialNumberDataService: SerialNumberDataService,
  ) {}

  async getTraceability(
    serialNumber: string,
    processCode?: string,
  ): Promise<TraceabilityResponse> {
    const normalizedSerialNumber = serialNumber?.trim();
    if (!normalizedSerialNumber) {
      throw new BadRequestException('serialNumber is required');
    }

    const normalizedProcessCode = processCode?.trim() || undefined;

    const serialNumbers = await this.resolveSerialNumbers(normalizedSerialNumber);

    const flows: TraceabilityFlow[] = [];
    for (const entry of serialNumbers) {
      flows.push(
        await this.buildFlowForSerialNumber(entry, normalizedProcessCode),
      );
    }

    return {
      serialNumber: normalizedSerialNumber,
      relatedSerialNumbers: serialNumbers,
      flows,
    };
  }

  private async buildFlowForSerialNumber(
    entry: TraceabilitySerialNumber,
    providedFlowCode?: string,
  ): Promise<TraceabilityFlow> {
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
      return { ...entry, workOrderCode, flowCode: null, steps: [] };
    }

    const processStepsContext = await this.findProcessSteps(
      flowCode,
      preferredClient,
    );

    const processSteps = processStepsContext?.steps ?? [];
    if (processSteps.length === 0) {
      return { ...entry, workOrderCode, flowCode, steps: [] };
    }

    const steps: TraceabilityProcessStep[] = [];
    for (const processStep of processSteps) {
      const stepTypeNo = processStep.mo_workstage?.step_type_no;
      if (!stepTypeNo) {
        continue;
      }

      const data =
        await this.serialNumberDataService.getProcessDataBySerialNumber(
          entry.serialNumber,
          stepTypeNo,
        );

      steps.push({
        stageCode: processStep.stage_code,
        processName: processStep.process_name ?? null,
        stageName: processStep.mo_workstage?.stage_name ?? null,
        stepTypeNo,
        data,
      });
    }

    return { ...entry, workOrderCode, flowCode, steps };
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
