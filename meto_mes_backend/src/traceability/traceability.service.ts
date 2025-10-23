import { BadRequestException, Injectable } from '@nestjs/common';
import { SerialNumberAaBaseInfo, SerialNumberDataService } from 'src/serial-number-data/serial-number-data.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SnType } from 'src/utils/sn';

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
  serialNumber: string;
  relatedSerialNumbers: TraceabilitySerialNumber[];
  flows: TraceabilityFlow[];
}

@Injectable()
export class TraceabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serialNumberDataService: SerialNumberDataService,
  ) {}

  async getTraceability(serialNumber: string): Promise<TraceabilityResponse> {
    const normalizedSerialNumber = serialNumber?.trim();
    if (!normalizedSerialNumber) {
      throw new BadRequestException('serialNumber is required');
    }

    const serialNumbers = await this.resolveSerialNumbers(normalizedSerialNumber);

    const flows: TraceabilityFlow[] = [];
    for (const entry of serialNumbers) {
      flows.push(await this.buildFlowForSerialNumber(entry));
    }

    return {
      serialNumber: normalizedSerialNumber,
      relatedSerialNumbers: serialNumbers,
      flows,
    };
  }

  private async buildFlowForSerialNumber(
    entry: TraceabilitySerialNumber,
  ): Promise<TraceabilityFlow> {
    const workOrderCode = await this.getWorkOrderCode(entry.serialNumber, entry.type);
    if (!workOrderCode) {
      return { ...entry, workOrderCode: null, flowCode: null, steps: [] };
    }

    const flowCode = await this.getFlowCode(workOrderCode);
    if (!flowCode) {
      return { ...entry, workOrderCode, flowCode: null, steps: [] };
    }

    const processSteps = await this.prisma.mo_process_flow.findMany({
      where: { process_code: flowCode },
      include: { mo_workstage: true },
      orderBy: { id: 'asc' },
    });

    const steps: TraceabilityProcessStep[] = [];
    for (const processStep of processSteps) {
      const stepTypeNo = processStep.mo_workstage?.step_type_no;
      if (!stepTypeNo) {
        continue;
      }

      const data = await this.serialNumberDataService.getProcessDataBySerialNumber(
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

    const beamInfo = await this.prisma.mo_beam_info.findFirst({
      where: { beam_sn: serialNumber },
    });

    if (beamInfo) {
      pushUnique(serialNumber, SnType.BEAM);
      const related = await this.prisma.mo_tag_shell_info.findFirst({
        where: { camera_sn: serialNumber },
        orderBy: { id: 'desc' },
      });
      pushUnique(related?.shell_sn, SnType.SHELL);
    } else {
      pushUnique(serialNumber, SnType.SHELL);
      const related = await this.prisma.mo_tag_shell_info.findFirst({
        where: { shell_sn: serialNumber },
        orderBy: { id: 'desc' },
      });
      pushUnique(related?.camera_sn, SnType.BEAM);
    }

    return entries;
  }

  private async getWorkOrderCode(serialNumber: string, type: SnType): Promise<string | null> {
    if (type === SnType.BEAM) {
      const beamInfo = await this.prisma.mo_beam_info.findFirst({
        where: { beam_sn: serialNumber },
      });
      return beamInfo?.work_order_code ?? null;
    }

    const tagInfo = await this.prisma.mo_tag_info.findFirst({
      where: { tag_sn: serialNumber },
    });
    return tagInfo?.work_order_code ?? null;
  }

  private async getFlowCode(workOrderCode: string): Promise<string | null> {
    const order = await this.prisma.mo_produce_order.findFirst({
      where: { work_order_code: workOrderCode },
    });
    return order?.flow_code ?? null;
  }
}
