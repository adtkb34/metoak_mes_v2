import { Injectable } from '@nestjs/common';

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
  /**
   * Retrieve process data for a given serial number.
   *
   * TODO: Replace the mock implementation with an integration
   * to the underlying data sources once they are available.
   */
  async getProcessDataBySerialNumber(serialNumber: string): Promise<SerialNumberProcessData> {
    return {
      serialNumber,
      processes: [],
    };
  }

  async getSuzhouShunyuAaBaseInfo(
    serialNumber: string,
    dbConfig: DatabaseConfig,
    parseResult: ResultParser,
  ): Promise<SerialNumberAaBaseInfo> {
    void dbConfig;
    void parseResult;

    return {
      serialNumber,
      process: '',
      timestamp: null,
      result: '',
      operator: '',
    };
  }

  async getSuzhouGuanghaojieAaBaseInfo(
    serialNumber: string,
    dbConfig: DatabaseConfig,
    parseResult: ResultParser,
  ): Promise<SerialNumberAaBaseInfo> {
    void dbConfig;
    void parseResult;

    return {
      serialNumber,
      process: '',
      timestamp: null,
      result: '',
      operator: '',
    };
  }

  async getMianyangAiweishiAaBaseInfo(
    serialNumber: string,
    dbConfig: DatabaseConfig,
    parseResult: ResultParser,
  ): Promise<SerialNumberAaBaseInfo> {
    void dbConfig;
    void parseResult;

    return {
      serialNumber,
      process: '',
      timestamp: null,
      result: '',
      operator: '',
    };
  }
}
