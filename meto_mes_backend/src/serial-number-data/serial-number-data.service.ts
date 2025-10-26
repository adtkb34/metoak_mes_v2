import { Injectable, Logger } from '@nestjs/common';
import {
  PrismaClient,
  mo_assemble_info,
  mo_material_binding,
  mo_tag_shell_info,
} from '@prisma/client';
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
  error_code: string;
}

export interface SerialNumberMaterialInfo {
  material: string;
  batchNo: string;
  time: string | null;
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
    } else if (stepTypeNo == STEP_NO.MO_STEREO_POSTCHECK) {
      for (const productOrigin of [
        ProductOrigin.SUZHOU,
        ProductOrigin.MIANYANG,
      ]) {
        processes.push(
          ...(await this.getStereoPostCheckBaseInfo(
            serialNumber,
            () => null,
            productOrigin,
          )),
        );
      }
    } else if (stepTypeNo == STEP_NO.MO_STEREO_PRECHECK) {
      for (const productOrigin of [
        ProductOrigin.SUZHOU,
        ProductOrigin.MIANYANG,
      ]) {
        processes.push(
          ...(await this.getStereoPreCheckBaseInfo(
            serialNumber,
            () => null,
            productOrigin,
          )),
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
    } else if (stepTypeNo == STEP_NO.PACKING) {
      for (const productOrigin of [
        ProductOrigin.SUZHOU,
        ProductOrigin.MIANYANG,
      ]) {
        processes.push(
          ...(await this.getPackingBaseInfo(
            serialNumber,
            () => null,
            productOrigin,
          )),
        );
      }
    } else {
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
    }
    return processes;
  }

  async getMaterialsBySerialNumber(
    serialNumber: string,
  ): Promise<SerialNumberMaterialInfo[]> {
    const normalizedSerialNumber = serialNumber?.trim();
    if (!normalizedSerialNumber) {
      return [];
    }

    const clients = this.getPrismaClients();
    const results: SerialNumberMaterialInfo[] = [];
    const seen = new Set<string>();
    const candidateCameraSns = new Set<string>([normalizedSerialNumber]);
    const tagRecords: mo_tag_shell_info[] = [];
    const seenTagRecordIds = new Set<string>();

    const addEntry = (
      material: string,
      batchNo?: string | null,
      time?: Date | null,
    ) => {
      const normalizedMaterial = material?.trim() || '物料';
      const normalizedBatchNo =
        typeof batchNo === 'string' ? batchNo.trim() : '';
      if (!normalizedBatchNo) {
        return;
      }

      const entry: SerialNumberMaterialInfo = {
        material: normalizedMaterial,
        batchNo: normalizedBatchNo,
        time: this.formatTimestamp(time ?? null),
      };

      const key = `${entry.material}|${entry.batchNo}|${entry.time ?? ''}`;
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      results.push(entry);
    };

    const addCandidateCameraSn = (value?: string | null) => {
      if (typeof value !== 'string') {
        return;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      candidateCameraSns.add(trimmed);
    };

    for (const client of clients) {
      const tagByCamera = await client.mo_tag_shell_info.findFirst({
        where: { camera_sn: normalizedSerialNumber },
        orderBy: [{ operation_time: 'desc' }, { id: 'desc' }],
      });
      const tagByShell = await client.mo_tag_shell_info.findFirst({
        where: { shell_sn: normalizedSerialNumber },
        orderBy: [{ operation_time: 'desc' }, { id: 'desc' }],
      });

      for (const record of [tagByCamera, tagByShell]) {
        if (!record) {
          continue;
        }

        const key =
          record.id != null
            ? record.id.toString()
            : `${record.camera_sn ?? ''}|${record.shell_sn ?? ''}|${record.operation_time?.getTime() ?? ''}`;
        if (seenTagRecordIds.has(key)) {
          continue;
        }

        seenTagRecordIds.add(key);
        tagRecords.push(record);
        addCandidateCameraSn(record.camera_sn);
      }
    }

    const cameraSnList = Array.from(candidateCameraSns);

    for (const client of clients) {
      for (const cameraSn of cameraSnList) {
        if (!cameraSn) {
          continue;
        }

        const bindings = (await client.mo_material_binding.findMany({
          where: { camera_sn: cameraSn },
          orderBy: [{ create_time: 'desc' }, { id: 'desc' }],
        })) as mo_material_binding[];
        const assembleRecords = (await client.mo_assemble_info.findMany({
          where: { camera_sn: cameraSn },
          orderBy: [{ start_time: 'desc' }, { id: 'desc' }],
        })) as mo_assemble_info[];

        for (const binding of bindings) {
          const materialName =
            (typeof binding.category === 'string' && binding.category.trim()) ||
            (typeof binding.category_no === 'string' &&
              binding.category_no.trim()) ||
            '物料';
          const batchNo =
            (typeof binding.material_batch_no === 'string' &&
              binding.material_batch_no.trim()) ||
            (typeof binding.material_serial_no === 'string' &&
              binding.material_serial_no.trim()) ||
            null;

          addEntry(
            materialName,
            batchNo,
            binding.create_time ?? binding.update_time ?? null,
          );
        }

        for (const record of assembleRecords) {
          const pcbaCode =
            typeof record.pcba_code === 'string' ? record.pcba_code.trim() : '';
          if (!pcbaCode) {
            continue;
          }

          addEntry('PCBA', pcbaCode, record.start_time ?? null);
        }
      }
    }

    for (const record of tagRecords) {
      if (typeof record.shell_sn === 'string') {
        const shellSn = record.shell_sn.trim();
        if (shellSn) {
          addEntry('外壳', shellSn, record.operation_time ?? null);
        }
      }

      if (typeof record.camera_sn === 'string') {
        const cameraSn = record.camera_sn.trim();
        if (cameraSn) {
          addEntry('模组', cameraSn, record.operation_time ?? null);
        }
      }
    }

    return results;
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
      error_code: this.normalizeErrorCode(record.error_code),
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
      error_code: this.normalizeErrorCode(record.error_code),
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
      error_code: this.normalizeErrorCode(record.error_code),
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
      orderBy: [{ add_time: 'desc' }, { id: 'desc' }],
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
      timestamp: this.formatTimestamp(record.add_time),
      result: record.error_code
        ? (this.parseResultValue(parseResult, record.ng_reason) ?? '')
        : (record.ng_reason ?? ''),
      operator: this.extractOperator(record),
      error_code: this.normalizeErrorCode(record.error_code),
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
      error_code: this.normalizeErrorCode(record.error_code),
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
      error_code: '',
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
      error_code: this.normalizeErrorCode(record.error_code),
    }));
  }

  async getPackingBaseInfo(
    serialNumber: string,
    parseResult: ResultParser,
    productOrigin: ProductOrigin,
  ): Promise<SerialNumberAaBaseInfo[]> {
    const client = this.prisma.getClientByOrigin(productOrigin);

    const records = await client.mo_packing_info.findMany({
      where: { camera_sn: serialNumber },
      orderBy: [{ start_time: 'desc' }, { id: 'desc' }],
    });

    if (!records || records.length === 0) return [];

    return records.map((record) => ({
      serialNumber,
      process: '打包',
      timestamp: this.formatTimestamp(record.start_time),
      result: 'SUCCESS',
      operator: this.extractOperator(record),
      error_code: this.normalizeErrorCode(0),
    }));
  }

  async getStereoPostCheckBaseInfo(
    serialNumber: string,
    parseResult: ResultParser,
    productOrigin: ProductOrigin,
  ): Promise<SerialNumberAaBaseInfo[]> {
    const client = this.prisma.getClientByOrigin(productOrigin);

    const records = await client.mo_stereo_postcheck.findMany({
      where: { sn: serialNumber },
      orderBy: [{ datetime: 'desc' }, { id: 'desc' }],
    });

    if (!records || records.length === 0) return [];

    return records.map((record) => ({
      serialNumber,
      process: '终检',
      timestamp: this.formatTimestamp(record.datetime),
      result:
        record.error_code == 0
          ? 'SUCCESS'
          : this.parseResultValue(parseResult, record.error_code),
      operator: this.extractOperator(record),
      error_code: this.normalizeErrorCode(record.error_code),
    }));
  }

  async getStereoPreCheckBaseInfo(
    serialNumber: string,
    parseResult: ResultParser,
    productOrigin: ProductOrigin,
  ): Promise<SerialNumberAaBaseInfo[]> {
    const client = this.prisma.getClientByOrigin(productOrigin);

    const records = await client.mo_stereo_precheck.findMany({
      where: { sn: serialNumber },
      orderBy: [{ datetime: 'desc' }, { id: 'desc' }],
    });

    if (!records || records.length === 0) return [];

    return records.map((record) => ({
      serialNumber,
      process: '性能检',
      timestamp: this.formatTimestamp(record.datetime),
      result:
        record.error_code == 0
          ? 'SUCCESS'
          : this.parseResultValue(parseResult, record.error_code),
      operator: this.extractOperator(record),
      error_code: this.normalizeErrorCode(record.error_code),
    }));
  }

  private formatTimestamp(value?: Date | null): string | null {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return null;
    }

    return value.toISOString();
  }

  private getPrismaClients(): PrismaClient[] {
    const clients: PrismaClient[] = [];
    const pushUnique = (client: PrismaClient | null | undefined) => {
      if (!client) {
        return;
      }

      if (!clients.includes(client)) {
        clients.push(client);
      }
    };

    pushUnique(this.prisma);

    for (const origin of [ProductOrigin.SUZHOU, ProductOrigin.MIANYANG]) {
      pushUnique(this.prisma.getClientByOrigin(origin));
    }

    return clients;
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

  private normalizeErrorCode(raw: unknown): string {
    if (raw === null || raw === undefined) {
      return '';
    }

    if (typeof raw === 'string') {
      return raw;
    }

    if (typeof raw === 'number') {
      if (Number.isNaN(raw) || !Number.isFinite(raw)) {
        return '';
      }
      return String(raw);
    }

    if (typeof raw === 'bigint') {
      return raw.toString();
    }

    return `${raw}`;
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
