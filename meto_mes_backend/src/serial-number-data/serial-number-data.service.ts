import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductOrigin } from '../common/enums/product-origin.enum';
import { STEP_NO } from 'src/utils/stepNo';

export interface SerialNumberProcessData {
  serialNumber: string;
  processes: Array<{
    name: string;
    status: string;
    timestamp?: string;
    [key: string]: unknown;
  }>;
}

export interface SerialNumberAaBaseInfo {
  serialNumber: string;
  process: string;
  timestamp: string | null;
  result: string;
  operator: string;
}

export type DatabaseConfig = Record<string, unknown>;

export type ResultParser<TResult = unknown> = (raw: unknown) => TResult;

@Injectable()
export class SerialNumberDataService {
  private readonly logger = new Logger(SerialNumberDataService.name);

  constructor(private readonly prisma: PrismaService) {}
  /**
   * Retrieve process data for a given serial number.
   *
   * TODO: Replace the mock implementation with an integration
   * to the underlying data sources once they are available.
   */
  async getProcessDataBySerialNumber(
    serialNumber: string,
    stepTypeNo: string,
  ): Promise<SerialNumberAaBaseInfo[]> {
    const processes: SerialNumberAaBaseInfo[] = [];
    if (stepTypeNo == STEP_NO.AUTO_ADJUST) {
      processes.push(
        ...(await this.getSuzhouShunyuAaBaseInfo(serialNumber, () => null)),
      );
      processes.push(
        ...(await this.getSuzhouGuanghaojieAaBaseInfo(
          serialNumber,
          // update_ng_reason_4_guanghaojie,
          () => null,
        )),
      );
      processes.push(
        ...(await this.getMianyangAiweishiAaBaseInfo(
          serialNumber,
          // update_ng_reason_4_aiweishi,
          () => null,
        )),
      );
    } else if (
      [
        STEP_NO.DIRTY_CHECKING,
        STEP_NO.UV_DISPENSING,
        STEP_NO.PLASMA,
        STEP_NO.MATERIAL_BINDING,
        STEP_NO.BEAM_APPEARANCE_INSPECTION,
        STEP_NO.LASER_MARKING_INSPECTION,
        STEP_NO.BEAM_SEALANT_COATING,
        STEP_NO.CMOS_APPEARANCE_INSPECTION,
        STEP_NO.FILM_REMOVAL_CLEANING,
        STEP_NO.SCREW_TIGHTENING_INSPECTION,
        STEP_NO.HIGH_TEMP_CURING_RECORD,
        STEP_NO.AFTER_AA_FINAL_COMPREHENSIVE_INSPECTION,
        STEP_NO.AFTER_AA_COATING_PROCESS_RECORD,
      ].includes(stepTypeNo as STEP_NO)
    ) {
      for (const productOrigin of [
        ProductOrigin.SUZHOU,
        ProductOrigin.MIANYANG,
      ]) {
        processes.push(
          ...(await this.getAaRelatedStepBaseInfo(
            serialNumber,
            () => null,
            stepTypeNo,
            productOrigin,
          )),
        );
      }
    } else if (stepTypeNo == STEP_NO.CALIB) {
      for (const productOrigin of [
        ProductOrigin.SUZHOU,
        ProductOrigin.MIANYANG,
      ]) {
        processes.push(
          ...(await this.getCalibBaseInfo(
            serialNumber,
            () => null,
            productOrigin,
          )),
        );
      }
    } else if (stepTypeNo == STEP_NO.ASSEMBLE_PCBA) {
      for (const productOrigin of [
        ProductOrigin.SUZHOU,
        ProductOrigin.MIANYANG,
      ]) {
        processes.push(
          ...(await this.getAssemblePCBABaseInfo(serialNumber, productOrigin)),
        );
      }
    } else if (stepTypeNo == STEP_NO.S315FQC) {
      for (const productOrigin of [
        ProductOrigin.SUZHOU,
        ProductOrigin.MIANYANG,
      ]) {
        processes.push(
          ...(await this.get315FinalCheckBaseInfo(
            serialNumber,
            () => null,
            productOrigin,
          )),
        );
      }
    }
    return processes;
  }

  async getSuzhouShunyuAaBaseInfo(
    serialNumber: string,
    parseResult: ResultParser,
  ): Promise<SerialNumberAaBaseInfo[]> {
    const client = this.prisma.getClientByOrigin(ProductOrigin.SUZHOU);

    // 查询所有匹配的记录（按时间倒序）
    const records = await client.mo_process_step_production_result.findMany({
      where: { product_sn: serialNumber, step_type_no: STEP_NO.AUTO_ADJUST },
      orderBy: [{ start_time: 'desc' }, { id: 'desc' }],
    });

    if (!records || records.length === 0) {
      return []; // ✅ 没数据时返回空数组，避免 undefined
    }

    // ✅ 遍历转换成 SerialNumberAaBaseInfo[]
    return records.map((record) => ({
      serialNumber,
      process: '苏州舜宇AA',
      timestamp: this.formatTimestamp(record.start_time),
      result: this.parseResultValue(parseResult, record.error_code),
      operator: this.extractOperator(record),
    }));
  }

  async getSuzhouGuanghaojieAaBaseInfo(
    serialNumber: string,
    parseResult: ResultParser,
  ): Promise<SerialNumberAaBaseInfo[]> {
    const client = this.prisma.getClientByOrigin(ProductOrigin.SUZHOU);

    const records = await client.mo_auto_adjust_info.findMany({
      where: { beam_sn: serialNumber },
      orderBy: [
        { operation_time: 'desc' },
        { add_time: 'desc' },
        { id: 'desc' },
      ],
    });

    if (!records || records.length === 0) return [];

    return records.map((record) => ({
      serialNumber,
      process: '苏州广浩捷AA',
      timestamp: this.pickInfoTimestamp(record),
      result: this.parseResultValue(parseResult, record.operation_result),
      operator: this.extractOperator(record),
    }));
  }

  async getMianyangAiweishiAaBaseInfo(
    serialNumber: string,
    parseResult: ResultParser,
  ): Promise<SerialNumberAaBaseInfo[]> {
    const client = this.prisma.getClientByOrigin(ProductOrigin.MIANYANG);

    const records = await client.mo_process_step_production_result.findMany({
      where: { product_sn: serialNumber, step_type_no: STEP_NO.AUTO_ADJUST },
      orderBy: [{ start_time: 'desc' }, { id: 'desc' }],
    });

    if (!records || records.length === 0) return [];

    return records.map((record) => ({
      serialNumber,
      process: '绵阳艾薇视AA',
      timestamp: this.formatTimestamp(record.start_time),
      result: record.error_code
        ? (this.parseResultValue(parseResult, record.ng_reason) ?? '')
        : (record.ng_reason ?? ''),
      operator: this.extractOperator(record),
    }));
  }

  async getAaRelatedStepBaseInfo(
    serialNumber: string,
    parseResult: ResultParser,
    stepTypeNo: String,
    productOrigin: ProductOrigin,
  ): Promise<SerialNumberAaBaseInfo[]> {
    const client = this.prisma.getClientByOrigin(productOrigin);

    const records = await client.mo_process_step_production_result.findMany({
      where: { product_sn: serialNumber, step_type_no: String(stepTypeNo) },
      orderBy: [{ start_time: 'desc' }, { id: 'desc' }],
    });

    const workstage = await client.mo_workstage.findFirst({
      where: { sys_step_type_no: String(stepTypeNo) },
    });

    if (!records || records.length === 0) return [];

    return records.map((record) => ({
      serialNumber,
      process:
        workstage?.stage_name ||
        record.step_type ||
        `未找到对应的工序名: ${stepTypeNo}`,
      timestamp: this.formatTimestamp(record.start_time),
      result: record.error_code
        ? (this.parseResultValue(parseResult, record.ng_reason) ?? '')
        : (record.ng_reason ?? ''),
      operator: this.extractOperator(record),
    }));
  }

  async getCalibBaseInfo(
    serialNumber: string,
    parseResult: ResultParser,
    productOrigin: ProductOrigin,
  ): Promise<SerialNumberAaBaseInfo[]> {
    const client = this.prisma.getClientByOrigin(productOrigin);

    const records = await client.mo_calibration.findMany({
      where: { camera_sn: serialNumber },
      orderBy: [{ start_time: 'desc' }, { id: 'desc' }],
    });

    if (!records || records.length === 0) return [];

    return records.map((record) => ({
      serialNumber,
      process: '双目标定',
      timestamp: this.formatTimestamp(record.start_time),
      result:
        record.error_code == 0
          ? 'SUCCESS'
          : this.parseResultValue(parseResult, record.error_code),
      operator: this.extractOperator(record),
    }));
  }

  async getAssemblePCBABaseInfo(
    serialNumber: string,
    productOrigin: ProductOrigin,
  ): Promise<SerialNumberAaBaseInfo[]> {
    const client = this.prisma.getClientByOrigin(productOrigin);

    const records = await client.mo_assemble_info.findMany({
      where: { camera_sn: serialNumber },
      orderBy: [{ start_time: 'desc' }, { id: 'desc' }],
    });

    if (!records || records.length === 0) return [];

    return records.map((record) => ({
      serialNumber,
      process: '组装PCBA',
      timestamp: this.formatTimestamp(record.start_time),
      result: 'SUCCESS',
      operator: this.extractOperator(record),
    }));
  }

  async get315FinalCheckBaseInfo(
    serialNumber: string,
    parseResult: ResultParser,
    productOrigin: ProductOrigin,
  ): Promise<SerialNumberAaBaseInfo[]> {
    const client = this.prisma.getClientByOrigin(productOrigin);

    const records = await client.mo_final_result.findMany({
      where: { camera_sn: serialNumber },
      orderBy: [{ check_time: 'desc' }, { id: 'desc' }],
    });

    if (!records || records.length === 0) return [];

    return records.map((record) => ({
      serialNumber,
      process: '终检',
      timestamp: this.formatTimestamp(record.check_time),
      result:
        record.error_code == 0
          ? 'SUCCESS'
          : this.parseResultValue(parseResult, record.error_code),
      operator: this.extractOperator(record),
    }));
  }

  private formatTimestamp(value?: Date | null): string | null {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return null;
    }

    return value.toISOString();
  }

  private pickInfoTimestamp(
    record?: {
      operation_time?: Date | null;
      add_time?: Date | null;
    } | null,
  ): string | null {
    if (!record) {
      return null;
    }

    return (
      this.formatTimestamp(record.operation_time ?? null) ??
      this.formatTimestamp(record.add_time ?? null)
    );
  }

  private parseResultValue(parser: ResultParser, raw: unknown): string {
    if (typeof parser !== 'function') {
      return `${raw}`;
    }

    try {
      const parsed = parser(raw);
      if (parsed === null || parsed === undefined) {
        return `${raw}`;
      }
      if (typeof parsed === 'string') {
        return parsed;
      }
      if (parsed instanceof Date) {
        return parsed.toISOString();
      }
      return String(parsed);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.warn(`Failed to parse AA result: ${message}`);
      return `${raw}`;
    }
  }

  private extractOperator(record: unknown): string {
    if (
      record &&
      typeof record === 'object' &&
      'operator' in record &&
      typeof (record as { operator?: unknown }).operator === 'string'
    ) {
      return (record as { operator?: string }).operator ?? '';
    }

    return '';
  }

  async update_ng_reason_4_guanghaojie(stepNo: String, ng_reason: String) {
    // ng_reason 去 mo_error_desc 获取 description.where stage = AA and error_code = ng_reason, 如果不存在就返回ng_reason
  }
}
