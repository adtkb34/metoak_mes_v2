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

const DEFAULT_SERIAL_NUMBER_KEYS = [
  'serialNumber',
  'serial_number',
  'sn',
  'SN',
  'beam_sn',
  'camera_sn',
  'product_sn',
  'tag_sn',
];

const DEFAULT_PROCESS_KEYS = ['process', 'processName', 'stage_name', 'step', 'name'];

const DEFAULT_TIMESTAMP_KEYS = [
  'timestamp',
  'time',
  'add_time',
  'operation_time',
  'start_time',
  'check_time',
  'end_time',
  'date',
];

const DEFAULT_RESULT_KEYS = [
  'result',
  'status',
  'check_result',
  'invalid',
  'ng_reason',
  'error_code',
  'outcome',
];

const DEFAULT_OPERATOR_KEYS = [
  'operator',
  'operator_name',
  'user',
  'user_name',
  'checker',
  'inspector',
];

type NormalizedAaConfig = {
  processName: string;
  dataset: unknown;
  processKeys: string[];
  serialNumberKeys: string[];
  timestampKeys: string[];
  resultKeys: string[];
  operatorKeys: string[];
  fallbackResult: string;
  fallbackOperator: string;
  fallbackTimestamp: string | null;
};

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
    return this.fetchAaBaseInfo(serialNumber, dbConfig, parseResult, {
      processName: '苏州顺宇 AA',
    });
  }

  async getSuzhouGuanghaojieAaBaseInfo(
    serialNumber: string,
    dbConfig: DatabaseConfig,
    parseResult: ResultParser,
  ): Promise<SerialNumberAaBaseInfo> {
    return this.fetchAaBaseInfo(serialNumber, dbConfig, parseResult, {
      processName: '苏州光浩捷 AA',
    });
  }

  async getMianyangAiweishiAaBaseInfo(
    serialNumber: string,
    dbConfig: DatabaseConfig,
    parseResult: ResultParser,
  ): Promise<SerialNumberAaBaseInfo> {
    return this.fetchAaBaseInfo(serialNumber, dbConfig, parseResult, {
      processName: '绵阳艾维视 AA',
    });
  }

  private async fetchAaBaseInfo(
    serialNumber: string,
    dbConfig: DatabaseConfig,
    parseResult: ResultParser,
    defaults: Partial<NormalizedAaConfig>,
  ): Promise<SerialNumberAaBaseInfo> {
    const normalizedSn = this.normalizeSerialNumber(serialNumber);
    const config = this.normalizeAaConfig(dbConfig, defaults);
    const raw = await this.queryDatabase(normalizedSn, dbConfig);
    const source = raw ?? config.dataset;
    const parser = this.ensureParser(parseResult);

    let parsed: unknown;
    try {
      const maybeParsed = parser(source);
      parsed = maybeParsed instanceof Promise ? await maybeParsed : maybeParsed;
    } catch (error) {
      parsed = source;
    }

    const record = this.findMatchingRecord(parsed, normalizedSn, config.serialNumberKeys);
    return this.buildBaseInfo(normalizedSn, config, record);
  }

  private normalizeSerialNumber(serialNumber: string): string {
    if (typeof serialNumber !== 'string') {
      throw new Error('Serial number must be a string');
    }
    const trimmed = serialNumber.trim();
    if (!trimmed) {
      throw new Error('Serial number is required');
    }
    return trimmed;
  }

  private normalizeAaConfig(
    dbConfig: DatabaseConfig,
    defaults: Partial<NormalizedAaConfig> = {},
  ): NormalizedAaConfig {
    const record = this.asRecord(dbConfig) ?? {};
    const processName = this.toStringOrDefault(
      record.processName ?? record.process ?? record.name,
      defaults.processName ?? '',
    );

    const dataset =
      record.dataset ??
      record.data ??
      record.rows ??
      record.records ??
      record.result ??
      record.payload ??
      defaults.dataset;

    const processKeys = this.normalizeKeyArray(
      record.processKeys ?? record.processKey ?? defaults.processKeys,
      defaults.processKeys ?? DEFAULT_PROCESS_KEYS,
    );
    const serialNumberKeys = this.normalizeKeyArray(
      record.serialNumberKeys ?? record.serialKeys ?? defaults.serialNumberKeys,
      defaults.serialNumberKeys ?? DEFAULT_SERIAL_NUMBER_KEYS,
    );
    const timestampKeys = this.normalizeKeyArray(
      record.timestampKeys ?? record.timestampKey ?? defaults.timestampKeys,
      defaults.timestampKeys ?? DEFAULT_TIMESTAMP_KEYS,
    );
    const resultKeys = this.normalizeKeyArray(
      record.resultKeys ?? record.resultKey ?? defaults.resultKeys,
      defaults.resultKeys ?? DEFAULT_RESULT_KEYS,
    );
    const operatorKeys = this.normalizeKeyArray(
      record.operatorKeys ?? record.operatorKey ?? defaults.operatorKeys,
      defaults.operatorKeys ?? DEFAULT_OPERATOR_KEYS,
    );

    const fallbackResult = this.extractString(
      record.fallbackResult ?? record.defaultResult ?? defaults.fallbackResult ?? '',
      defaults.fallbackResult ?? '',
    );
    const fallbackOperator = this.extractString(
      record.fallbackOperator ?? defaults.fallbackOperator ?? '',
      defaults.fallbackOperator ?? '',
    );
    const fallbackTimestamp = this.toOptionalTimestamp(
      record.fallbackTimestamp ?? defaults.fallbackTimestamp ?? null,
    );

    return {
      processName,
      dataset,
      processKeys,
      serialNumberKeys,
      timestampKeys,
      resultKeys,
      operatorKeys,
      fallbackResult,
      fallbackOperator,
      fallbackTimestamp,
    };
  }

  private async queryDatabase(
    serialNumber: string,
    dbConfig: DatabaseConfig,
  ): Promise<unknown | undefined> {
    const record = this.asRecord(dbConfig);
    if (!record) {
      return undefined;
    }

    const fetcherKeys = [
      'fetch',
      'fetcher',
      'loader',
      'getData',
      'query',
      'resolve',
      'executor',
      'provider',
    ];

    for (const key of fetcherKeys) {
      const candidate = record[key];
      if (typeof candidate === 'function') {
        const result = candidate(serialNumber, record);
        return result instanceof Promise ? await result : result;
      }
    }

    const datasetKeys = [
      'dataset',
      'data',
      'rows',
      'records',
      'result',
      'payload',
      'response',
      'body',
    ];

    for (const key of datasetKeys) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        return record[key];
      }
    }

    return undefined;
  }

  private ensureParser<TResult>(parseResult?: ResultParser<TResult>): ResultParser<TResult> {
    if (typeof parseResult === 'function') {
      return parseResult;
    }
    return ((value: unknown) => value as TResult);
  }

  private findMatchingRecord(
    source: unknown,
    serialNumber: string,
    serialKeys: string[],
  ): Record<string, unknown> | null {
    if (!serialNumber) {
      return this.asRecord(source);
    }

    const normalizedSn = serialNumber.toLowerCase();

    if (Array.isArray(source)) {
      for (const item of source) {
        const record = this.asRecord(item);
        if (record && this.hasSerial(record, normalizedSn, serialKeys)) {
          return record;
        }
      }

      for (const item of source) {
        const record = this.asRecord(item);
        if (record) {
          return record;
        }
      }
      return null;
    }

    const record = this.asRecord(source);
    if (!record) {
      return null;
    }

    if (this.hasSerial(record, normalizedSn, serialKeys)) {
      return record;
    }

    for (const [key, value] of Object.entries(record)) {
      if (key.toLowerCase() === normalizedSn) {
        const nested = this.asRecord(value);
        if (nested) {
          return nested;
        }
        return { value };
      }
    }

    for (const value of Object.values(record)) {
      if (Array.isArray(value)) {
        const nested = this.findMatchingRecord(value, serialNumber, serialKeys);
        if (nested) {
          return nested;
        }
      } else {
        const nestedRecord = this.asRecord(value);
        if (nestedRecord && this.hasSerial(nestedRecord, normalizedSn, serialKeys)) {
          return nestedRecord;
        }
      }
    }

    return record;
  }

  private hasSerial(
    record: Record<string, unknown>,
    normalizedSn: string,
    serialKeys: string[],
  ): boolean {
    const keysToCheck = serialKeys.length ? serialKeys : DEFAULT_SERIAL_NUMBER_KEYS;
    return keysToCheck.some((key) => {
      if (!Object.prototype.hasOwnProperty.call(record, key)) {
        return false;
      }
      const value = record[key];
      if (value === undefined || value === null) {
        return false;
      }
      return String(value).trim().toLowerCase() === normalizedSn;
    });
  }

  private buildBaseInfo(
    serialNumber: string,
    config: NormalizedAaConfig,
    record: Record<string, unknown> | null,
  ): SerialNumberAaBaseInfo {
    const process = this.toStringOrDefault(
      record ? this.pickFirstValue(record, config.processKeys) : undefined,
      config.processName,
    );
    const timestampValue = record
      ? this.pickFirstValue(record, config.timestampKeys)
      : config.fallbackTimestamp;
    const resultValue = record
      ? this.pickFirstValue(record, config.resultKeys)
      : config.fallbackResult;
    const operatorValue = record
      ? this.pickFirstValue(record, config.operatorKeys)
      : config.fallbackOperator;

    return {
      serialNumber,
      process,
      timestamp: this.toOptionalTimestamp(timestampValue),
      result: this.toStringOrDefault(resultValue, config.fallbackResult),
      operator: this.toStringOrDefault(operatorValue, config.fallbackOperator),
    };
  }

  private pickFirstValue(
    record: Record<string, unknown>,
    keys: string[],
  ): unknown {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        return record[key];
      }
    }
    return undefined;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || value instanceof Date) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private normalizeKeyArray(value: unknown, fallback: string[]): string[] {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item))
        .filter((item, index, self) => self.indexOf(item) === index);
    }
    if (typeof value === 'string') {
      return [value];
    }
    return fallback;
  }

  private extractString(value: unknown, fallback: string): string {
    if (value === undefined || value === null) {
      return fallback;
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return String(value);
    }
    return fallback;
  }

  private toStringOrDefault(value: unknown, fallback: string): string {
    if (value === undefined || value === null) {
      return fallback;
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch (error) {
      return fallback;
    }
  }

  private toOptionalTimestamp(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        return null;
      }
      if (value > 1e12) {
        return new Date(value).toISOString();
      }
      if (value > 1e9) {
        return new Date(value * 1000).toISOString();
      }
      return value.toString();
    }
    return String(value);
  }
}
