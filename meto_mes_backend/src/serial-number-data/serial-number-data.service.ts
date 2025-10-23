import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductOrigin } from '../common/enums/product-origin.enum';

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
  ): Promise<SerialNumberProcessData> {
    return {
      serialNumber,
      processes: [],
    };
  }

  async getSuzhouShunyuAaBaseInfo(
    serialNumber: string,
    parseResult: ResultParser,
  ): Promise<SerialNumberAaBaseInfo> {
    const client = this.prisma.getClientByOrigin(ProductOrigin.SUZHOU);

    const record = await client.mo_auto_adjust_st08.findFirst({
      where: { beam_sn: serialNumber },
      orderBy: [
        { add_time: 'desc' },
        { id: 'desc' },
      ],
    });

    return {
      serialNumber,
      process: '苏州舜宇AA',
      timestamp: this.formatTimestamp(record?.add_time),
      result: this.parseResultValue(parseResult, record?.error_code),
      operator: this.extractOperator(record),
    };
  }

  async getSuzhouGuanghaojieAaBaseInfo(
    serialNumber: string,
    parseResult: ResultParser,
  ): Promise<SerialNumberAaBaseInfo> {
    const client = this.prisma.getClientByOrigin(ProductOrigin.SUZHOU);

    const record = await client.mo_auto_adjust_info.findFirst({
      where: { beam_sn: serialNumber },
      orderBy: [
        { operation_time: 'desc' },
        { add_time: 'desc' },
        { id: 'desc' },
      ],
    });

    return {
      serialNumber,
      process: '苏州广浩捷AA',
      timestamp: this.pickInfoTimestamp(record),
      result: this.parseResultValue(parseResult, record?.operation_result),
      operator: this.extractOperator(record),
    };
  }

  async getMianyangAiweishiAaBaseInfo(
    serialNumber: string,
    parseResult: ResultParser,
  ): Promise<SerialNumberAaBaseInfo> {
    const client = this.prisma.getClientByOrigin(ProductOrigin.MIANYANG);

    const record = await client.mo_auto_adjust_st08.findFirst({
      where: { beam_sn: serialNumber },
      orderBy: [
        { add_time: 'desc' },
        { id: 'desc' },
      ],
    });

    return {
      serialNumber,
      process: '绵阳艾为视AA',
      timestamp: this.formatTimestamp(record?.add_time),
      result: this.parseResultValue(parseResult, record?.error_code),
      operator: this.extractOperator(record),
    };
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
      return '';
    }

    try {
      const parsed = parser(raw);
      if (parsed === null || parsed === undefined) {
        return '';
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
      return '';
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
}
