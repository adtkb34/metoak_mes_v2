import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaClient, mo_workstage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProductOrigin,
  PRODUCT_ORIGIN_OPTIONS,
} from '../common/enums/product-origin.enum';
import { STEP_NO } from 'src/utils/stepNo';

export interface ProductOption {
  label: string;
  code: string;
}

interface ProductOptionQueryParams {
  startDate?: string;
  endDate?: string;
  origin?: ProductOrigin;
}

type EquipmentSource = 'INFO' | 'ST08';

export interface EquipmentOption {
  label: string;
  value: string;
}

interface EquipmentDefinition extends EquipmentOption {
  source: EquipmentSource;
  stationNum?: number;
}

interface StepConfig {
  equipmentByOrigin: Partial<Record<ProductOrigin, EquipmentDefinition[]>>;
}

const STEP_CONFIGS: Record<string, StepConfig> = {
  '002': {
    equipmentByOrigin: {
      [ProductOrigin.SUZHOU]: [
        { label: '广浩捷', value: '0', source: 'INFO', stationNum: 7 },
        { label: '舜宇', value: '1', source: 'ST08' },
      ],
      [ProductOrigin.MIANYANG]: [
        { label: '艾薇视', value: '2', source: 'ST08' },
      ],
    },
  },
};

interface DashboardSummaryParams {
  stepTypeNo?: string;
  startDate?: string;
  endDate?: string;
  origin?: ProductOrigin;
  product?: string | null;
}

interface ProcessMetricRow {
  id: string;
  name: string;
  output: number;
  firstPassYield: number;
  finalYield: number;
  wip: number;
  trend: number;
  targetOutput: number;
}

export interface DashboardSummaryResult {
  filters: {
    products: ProductOption[];
    origins: Array<{ label: string; value: ProductOrigin }>;
  };
  processes: ProcessMetricRow[];
  workOrders: Array<Record<string, unknown>>;
}

interface ProcessDetailParams extends DashboardSummaryParams {
  processId: string;
  equipmentIds?: string[];
}

interface ProcessMetricsParams extends DashboardSummaryParams {
  product: string;
  deviceNos?: string[];
  stations?: string[];
}

export interface ProcessMetricsItem {
  processId: string;
  processName: string;
  output: number;
  firstPassYield: number;
  finalYield: number;
  productYield: number;
}

export interface ProcessMetricsResult {
  filters: {
    origin?: ProductOrigin;
    product?: string | null;
    startDate?: string;
    endDate?: string;
    deviceNos?: string[];
    stations?: string[];
  };
  metrics: ProcessMetricsItem[];
}

interface AggregatedProcessMetric {
  output: number;
  firstPassYield: number;
  finalYield: number;
  productYield: number;
}

export interface ProcessDetailRow {
  id: string;
  product: string;
  origin: ProductOrigin;
  batch: string;
  date: string;
  equipment: string;
  station: string;
  output: number;
  firstPassRate: number;
  finalPassRate: number;
  scrapCount: number;
  reworkCount: number;
  defects: Array<{ reason: string; count: number }>;
}

export interface ProcessDetailData {
  processId: string;
  processName: string;
  equipmentOptions: EquipmentOption[];
  stationOptions: EquipmentOption[];
  rows: ProcessDetailRow[];
}

interface DateRange {
  start?: Date;
  end?: Date;
}

interface ProcessMetricLoaderParams {
  product: string;
  client: PrismaClient;
  stepTypeNo: string;
  range: DateRange;
}

interface GenericProcessMetricRow {
  step: string | null;
  output?: unknown;
  firstPass?: unknown;
  finalYield?: unknown;
  productYield?: unknown;
}

interface ProcessMetricQueryData {
  rows: GenericProcessMetricRow[];
  hasOutput: boolean;
  hasFirstPass: boolean;
  hasFinalYield: boolean;
  hasProductYield: boolean;
}

interface NormalizedRecord {
  beamSn: string;
  timestamp: Date;
  success: boolean;
}

interface StatisticsResult {
  totalOutput: number;
  firstPassRate: number;
  finalPassRate: number;
  firstPassCount: number;
  finalPassCount: number;
  scrapCount: number;
  reworkCount: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(
    params: DashboardSummaryParams,
  ): Promise<DashboardSummaryResult> {
    const stepTypeNo = params.stepTypeNo?.trim() || '002';
    const { start, end } = this.normalizeDateRange(
      params.startDate,
      params.endDate,
    );

    const stage = await this.prisma.mo_workstage.findFirst({
      where: { step_type_no: stepTypeNo },
    });

    const origin = params.origin;

    let processMetrics: ProcessMetricRow[] = [];

    if (origin !== undefined) {
      const statistics = await this.calculateStepStatistics({
        origin,
        stepTypeNo,
        range: { start, end },
      });

      processMetrics = [
        this.buildProcessMetricRow(stepTypeNo, stage, statistics),
      ];
    }

    if (!processMetrics.length) {
      processMetrics = [this.buildProcessMetricRow(stepTypeNo, stage)];
    }

    let products: ProductOption[] = [];
    try {
      if (origin !== undefined) {
        products = await this.getProductOptions({
          startDate: params.startDate,
          endDate: params.endDate,
          origin,
        });
      }
    } catch (error) {
      this.logger.warn('Failed to load dashboard products', error);
    }

    return {
      filters: {
        products,
        origins: PRODUCT_ORIGIN_OPTIONS,
      },
      processes: processMetrics,
      workOrders: [],
    };
  }

  private buildProcessMetricRow(
    stepTypeNo: string,
    stage: mo_workstage | null,
    statistics?: StatisticsResult,
  ): ProcessMetricRow {
    return {
      id: stepTypeNo,
      name: this.getStageDisplayName(stage, stepTypeNo),
      output: statistics?.totalOutput ?? 0,
      firstPassYield: statistics?.firstPassRate ?? 0,
      finalYield: statistics?.finalPassRate ?? 0,
      wip: 0,
      trend: 0,
      targetOutput: 0,
    };
  }

  private getStageDisplayName(
    stage: mo_workstage | null,
    stepTypeNo: string,
  ): string {
    const stageName = stage?.stage_name?.trim();
    if (stageName) {
      return stageName;
    }

    const stageCode = stage?.stage_code?.trim();
    if (stageCode) {
      return stageCode;
    }

    return `工序 ${stepTypeNo}`;
  }

  async getProcessDetail(
    params: ProcessDetailParams,
  ): Promise<ProcessDetailData> {
    const stepTypeNo = params.processId?.trim();
    if (!stepTypeNo) {
      throw new Error('缺少工序编号');
    }

    const origin = params.origin;

    const stage = await this.prisma.mo_workstage.findFirst({
      where: { step_type_no: stepTypeNo },
    });

    const { start, end } = this.normalizeDateRange(
      params.startDate,
      params.endDate,
    );

    const equipmentDefinitions =
      origin !== undefined
        ? this.getEquipmentDefinitions(stepTypeNo, origin)
        : [];

    const equipmentOptions = equipmentDefinitions.map(({ label, value }) => ({
      label,
      value,
    }));

    const rows: ProcessDetailRow[] = [];

    if (origin !== undefined && equipmentDefinitions.length) {
      const definitionsToUse = this.filterEquipmentDefinitions(
        equipmentDefinitions,
        params.equipmentIds,
      );

      const statsList = await Promise.all(
        definitionsToUse.map((definition) =>
          this.calculateStepStatistics({
            origin,
            stepTypeNo,
            range: { start, end },
            equipment: [definition],
          }).then((result) => ({ definition, result })),
        ),
      );

      for (const { definition, result } of statsList) {
        rows.push({
          id: `${stepTypeNo}-${definition.value}`,
          product: params.product ?? '',
          origin,
          batch: '',
          date: this.formatDateRange(params.startDate, params.endDate),
          equipment: definition.label,
          station:
            definition.source === 'INFO'
              ? String(definition.stationNum ?? '')
              : 'ST08',
          output: result.totalOutput,
          firstPassRate: result.firstPassRate,
          finalPassRate: result.finalPassRate,
          scrapCount: result.scrapCount,
          reworkCount: result.reworkCount,
          defects: [],
        });
      }
    }

    return {
      processId: stepTypeNo,
      processName: stage?.stage_name ?? `工序 ${stepTypeNo}`,
      equipmentOptions,
      stationOptions: [],
      rows,
    };
  }

  async getProcessMetrics(
    params: ProcessMetricsParams,
  ): Promise<ProcessMetricsResult> {
    const normalizedStepTypeNo = params.stepTypeNo?.trim();
    const processId = normalizedStepTypeNo ?? '';

    const metrics: ProcessMetricsItem[] = [
      {
        processId,
        processName: processId ? `工序 ${processId}` : '工序',
        output: 0,
        firstPassYield: 0,
        finalYield: 0,
        productYield: 0,
      },
    ];
    if (params.origin !== undefined && normalizedStepTypeNo) {
      const { start, end } = this.normalizeDateRange(
        params.startDate,
        params.endDate,
      );

      try {
        const client = this.prisma.getClientByOrigin(params.origin);
        const product = params.product;
        let data: AggregatedProcessMetric | undefined;

        // if (normalizedStepTypeNo === STEP_NO.AUTO_ADJUST) {
        //   data = await this.loadAutoAdjustMetrics({
        //     origin: params.origin,
        //     range: { start, end },
        //   });
        // } else if (normalizedStepTypeNo === STEP_NO.CALIB) {
        //   data = await this.loadCalibMetrics({
        //     client,
        //     stepTypeNo: normalizedStepTypeNo,
        //     range: { start, end },
        //   });
        // } else if (normalizedStepTypeNo === STEP_NO.ASSEMBLE_PCBA) {
        //   data = await this.loadAssemblePcbaMetrics({
        //     client,
        //     stepTypeNo: normalizedStepTypeNo,
        //     range: { start, end },
        //   });
        // } else if (normalizedStepTypeNo === STEP_NO.S315FQC) {
        //   data = await this.loadS315FqcMetrics({
        //     client,
        //     stepTypeNo: normalizedStepTypeNo,
        //     range: { start, end },
        //   });
        // } else {
        data = await this.loadProcessProductionMetrics({
          product,
          client,
          stepTypeNo: normalizedStepTypeNo,
          range: { start, end },
        });
        // }

        if (data) {
          const metric = metrics[0];
          metric.output = data.output;
          metric.firstPassYield = data.firstPassYield;
          metric.finalYield = data.finalYield;
          metric.productYield = data.productYield;
        }
      } catch (error) {
        this.logger.error(
          `Failed to load process metrics from mo_process_step_production_result: ${error.message}`,
          error.stack,
        );
      }
    }

    return {
      filters: {
        origin: params.origin,
        product: params.product ?? null,
        startDate: params.startDate,
        endDate: params.endDate,
        deviceNos: params.deviceNos,
        stations: params.stations,
      },
      metrics,
    };
  }

  async getEquipmentOptions(
    stepTypeNo: string,
    origin: ProductOrigin,
  ): Promise<EquipmentOption[]> {
    const definitions = this.getEquipmentDefinitions(stepTypeNo, origin);
    return definitions.map(({ label, value }) => ({ label, value }));
  }

  async getProductOptions(
    params: ProductOptionQueryParams,
  ): Promise<ProductOption[]> {
    const { startDate, endDate, origin } = params;
    const prismaClient = this.prisma.getClientByOrigin(origin);

    // 🧠 检查表字段
    const hasAddTime = await prismaClient.$queryRaw<{ Field: string }[]>`
    SHOW COLUMNS FROM mo_process_step_production_result LIKE 'add_time';
  `;

    // 如果没有 add_time，就用 start_time
    const timeField =
      hasAddTime.length > 0 ? Prisma.sql`add_time` : Prisma.sql`start_time`;

    const normalizedStart = this.normalizeDate('start', startDate);
    const normalizedEnd = this.normalizeDate('end', endDate);

    const conditions: Prisma.Sql[] = [Prisma.sql`product_sn IS NOT NULL`];
    if (normalizedStart)
      conditions.push(Prisma.sql`${timeField} >= ${normalizedStart}`);
    if (normalizedEnd)
      conditions.push(Prisma.sql`${timeField} <= ${normalizedEnd}`);
    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    try {
      const rows = await prismaClient.$queryRaw<
        { material_name: string | null; material_code: string | null }[]
      >(Prisma.sql`
      WITH filtered_sn AS (
        SELECT DISTINCT product_sn
        FROM mo_process_step_production_result
        ${whereClause}
      ),
      work_orders AS (
        SELECT DISTINCT mbi.work_order_code
        FROM filtered_sn fs
        JOIN mo_beam_info mbi ON mbi.beam_sn = fs.product_sn
        WHERE mbi.work_order_code IS NOT NULL
        UNION
        SELECT DISTINCT mti.work_order_code
        FROM filtered_sn fs
        JOIN mo_tag_info mti ON mti.tag_sn = fs.product_sn
        WHERE mti.work_order_code IS NOT NULL
      )
      SELECT DISTINCT
        mpo.work_order_code,
        mpo.material_name,
        mpo.material_code
      FROM work_orders wo
      JOIN mo_produce_order mpo ON mpo.work_order_code = wo.work_order_code
      WHERE mpo.material_name IS NOT NULL
        AND mpo.material_code IS NOT NULL
      ORDER BY mpo.material_name, mpo.material_code;
    `);

      // 去重
      const unique = new Map<string, ProductOption>();
      for (const row of rows) {
        const name = row.material_name?.trim();
        const code = row.material_code?.trim() ?? '';
        if (name && !unique.has(name))
          unique.set(name, { label: `${name}${code}`, code: name });
      }
      return [...unique.values()];
    } catch (error) {
      this.logger.error(
        `Failed to load dashboard product options: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async loadAutoAdjustMetrics(params: {
    origin: ProductOrigin;
    range: DateRange;
  }): Promise<AggregatedProcessMetric | undefined> {
    const definitions = this.getEquipmentDefinitions(
      STEP_NO.AUTO_ADJUST,
      params.origin,
    );

    if (!definitions.length) {
      return undefined;
    }

    const statistics = await this.calculateStepStatistics({
      origin: params.origin,
      stepTypeNo: STEP_NO.AUTO_ADJUST,
      range: params.range,
      equipment: definitions,
    });

    if (!statistics.totalOutput) {
      return undefined;
    }

    return {
      output: statistics.totalOutput,
      firstPassYield: this.clampRate(statistics.firstPassRate),
      finalYield: this.clampRate(statistics.finalPassRate),
      productYield: this.clampRate(statistics.finalPassRate),
    };
  }

  private async loadCalibMetrics(
    params: ProcessMetricLoaderParams,
  ): Promise<AggregatedProcessMetric | undefined> {
    const data = await this.fetchGenericProcessMetricData(params);
    if (!data) {
      return undefined;
    }
    return this.aggregateProcessMetricData(data);
  }

  private async loadAssemblePcbaMetrics(
    params: ProcessMetricLoaderParams,
  ): Promise<AggregatedProcessMetric | undefined> {
    const data = await this.fetchGenericProcessMetricData(params);
    if (!data) {
      return undefined;
    }
    return this.aggregateProcessMetricData(data);
  }

  private async loadS315FqcMetrics(
    params: ProcessMetricLoaderParams,
  ): Promise<AggregatedProcessMetric | undefined> {
    const data = await this.fetchGenericProcessMetricData(params);
    if (!data) {
      return undefined;
    }
    return this.aggregateProcessMetricData(data);
  }

  private async loadProcessProductionMetrics(
    params: ProcessMetricLoaderParams,
  ): Promise<AggregatedProcessMetric | undefined> {
    const data = await this.fetchGenericProcessMetricData(params);
    if (!data) {
      return undefined;
    }
    return this.aggregateProcessMetricData(data);
  }

  private async queryBeamInfoProducts(
    client: PrismaClient,
    baseSql: Prisma.Sql, // 基础查询片段，如 SELECT ... FROM ...
    alias: string, // 表别名，例如 "mbi"
    materialCode: string, // 物料编号
    filterClause?: Prisma.Sql | null, // 可选额外筛选条件
  ): Promise<{ product_sn: string }[]> {
    const query = Prisma.sql`
    ${baseSql}
    INNER JOIN mo_beam_info AS mbi
      ON mbi.beam_sn = ${Prisma.raw(alias)}.product_sn
    INNER JOIN mo_produce_order AS mpo
      ON mpo.work_order_code = mbi.work_order_code
    WHERE mpo.material_code = ${materialCode}
    ${filterClause ? Prisma.sql`AND ${filterClause}` : Prisma.empty}
  `;

    const rows = await client.$queryRaw<{ product_sn: string }[]>(query);
    return rows;
  }

  /**
   * 获取通过 mo_tag_info 关联的查询 SQL
   */
  private async queryTagInfoProducts(
    client: PrismaClient,
    baseSql: Prisma.Sql, // 原始 SQL 片段
    alias: string, // 别名（例如 'mti'）
    materialCode: string, // 物料号
    filterClause?: Prisma.Sql | null, // 可选额外筛选条件
  ): Promise<{ product_sn: string }[]> {
    const query = Prisma.sql`
    ${baseSql}
    INNER JOIN mo_tag_info AS mti
      ON mti.tag_sn = ${Prisma.raw(alias)}.product_sn
    INNER JOIN mo_produce_order AS mpo
      ON mpo.work_order_code = mti.work_order_code
    WHERE mpo.material_code = ${materialCode}
    ${filterClause ? Prisma.sql`AND ${filterClause}` : Prisma.empty}
  `;

    // 直接执行并返回结果
    const rows = await client.$queryRaw<{ product_sn: string }[]>(query);
    return rows;
  }

  private async fetchGenericProcessMetricData(
    params: ProcessMetricLoaderParams,
  ): Promise<ProcessMetricQueryData | undefined> {
    const { product, client, stepTypeNo, range } = params;
    const tableAlias = 'mpspr';
    const baseSql = Prisma.sql`
      SELECT ${Prisma.raw(tableAlias)}.product_sn, ${Prisma.raw(tableAlias)}.error_code, ${Prisma.raw(tableAlias)}.start_time, ${Prisma.raw(tableAlias)}.end_time
      FROM mo_process_step_production_result AS ${Prisma.raw(tableAlias)}
    `;

    const filterClause = Prisma.sql`${Prisma.raw(tableAlias)}.step_type_no = ${stepTypeNo} AND ${Prisma.raw(tableAlias)}.add_time > ${range[0]} AND ${Prisma.raw(tableAlias)}.add_time < ${range[1]}`;
    let rows = await this.queryBeamInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
    );
    rows.push(
      ...(await this.queryTagInfoProducts(
        client,
        baseSql,
        tableAlias,
        product,
        filterClause,
      )),
    );
    return undefined;
  }

  private aggregateProcessMetricData(
    rows: ,
  ): AggregatedProcessMetric | undefined {
    const { rows, hasOutput, hasFirstPass, hasFinalYield, hasProductYield } =
      data;

    interface AggregationState {
      output: number;
      firstPassWeighted: number;
      finalWeighted: number;
      productWeighted: number;
      weight: number;
    }

    const state: AggregationState = {
      output: 0,
      firstPassWeighted: 0,
      finalWeighted: 0,
      productWeighted: 0,
      weight: 0,
    };

    let hasRows = false;

    for (const row of rows) {
      const step = row.step?.trim();
      if (!step) {
        continue;
      }

      hasRows = true;

      const outputValue = hasOutput ? this.parseNumericValue(row.output) : 0;
      const weightBase = hasOutput ? Math.max(outputValue, 0) : 1;
      const effectiveWeight = weightBase > 0 ? weightBase : 1;

      if (hasOutput) {
        state.output += outputValue;
      }

      if (hasFirstPass) {
        const rate = this.parseRate(row.firstPass);
        state.firstPassWeighted += rate * effectiveWeight;
      }

      if (hasFinalYield) {
        const rate = this.parseRate(row.finalYield);
        state.finalWeighted += rate * effectiveWeight;
      }

      if (hasProductYield) {
        const rate = this.parseRate(row.productYield);
        state.productWeighted += rate * effectiveWeight;
      }

      state.weight += effectiveWeight;
    }

    if (!hasRows) {
      return undefined;
    }

    const weight = state.weight || 0;

    return {
      output: state.output,
      firstPassYield:
        hasFirstPass && weight
          ? this.clampRate(state.firstPassWeighted / weight)
          : 0,
      finalYield:
        hasFinalYield && weight
          ? this.clampRate(state.finalWeighted / weight)
          : 0,
      productYield:
        hasProductYield && weight
          ? this.clampRate(state.productWeighted / weight)
          : 0,
    };
  }

  private detectColumn(
    columns: string[],
    patterns: Array<string | RegExp>,
  ): string | undefined {
    const normalized = columns.map((item) => item.toLowerCase());

    for (const pattern of patterns) {
      if (typeof pattern === 'string') {
        const index = normalized.indexOf(pattern.toLowerCase());
        if (index !== -1) {
          return columns[index];
        }
        continue;
      }

      const foundIndex = normalized.findIndex((column) => pattern.test(column));
      if (foundIndex !== -1) {
        return columns[foundIndex];
      }
    }

    return undefined;
  }

  private parseNumericValue(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return 0;
      }
      const normalized = trimmed.replace(/,/g, '');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    if (typeof value === 'object' && value !== null) {
      const maybeDecimal = value as { toNumber?: () => number };
      if (typeof maybeDecimal.toNumber === 'function') {
        const parsed = Number(maybeDecimal.toNumber());
        return Number.isFinite(parsed) ? parsed : 0;
      }
    }

    return 0;
  }

  private parseRate(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return 0;
      }
      if (trimmed.endsWith('%')) {
        const numeric = Number(trimmed.slice(0, -1));
        if (!Number.isFinite(numeric)) {
          return 0;
        }
        return this.clampRate(numeric / 100);
      }
      const normalized = trimmed.replace(/,/g, '');
      const parsed = Number(normalized);
      if (!Number.isFinite(parsed)) {
        return 0;
      }
      return this.clampRate(parsed > 1 ? parsed / 100 : parsed);
    }

    const numeric = this.parseNumericValue(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }

    return this.clampRate(numeric > 1 ? numeric / 100 : numeric);
  }

  private clampRate(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    if (value < 0) {
      return 0;
    }

    if (value > 1) {
      return 1;
    }

    return value;
  }

  private normalizeDate(
    kind: 'start' | 'end',
    value?: string,
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return kind === 'start' ? `${trimmed} 00:00:00` : `${trimmed} 23:59:59`;
    }

    return trimmed;
  }

  private normalizeDateRange(start?: string, end?: string): DateRange {
    const parse = (
      value?: string,
      kind: 'start' | 'end' = 'start',
    ): Date | undefined => {
      if (!value) {
        return undefined;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const date = new Date(trimmed);
        if (Number.isNaN(date.getTime())) {
          return undefined;
        }
        if (kind === 'start') {
          date.setHours(0, 0, 0, 0);
        } else {
          date.setHours(23, 59, 59, 999);
        }
        return date;
      }

      const date = new Date(trimmed);
      return Number.isNaN(date.getTime()) ? undefined : date;
    };

    return {
      start: parse(start, 'start'),
      end: parse(end, 'end'),
    };
  }

  private getEquipmentDefinitions(
    stepTypeNo: string,
    origin: ProductOrigin,
  ): EquipmentDefinition[] {
    const config = STEP_CONFIGS[stepTypeNo];
    if (!config) {
      return [];
    }

    return (
      config.equipmentByOrigin[origin]?.map((definition) => ({
        ...definition,
        value: String(definition.value),
      })) ?? []
    );
  }

  private filterEquipmentDefinitions(
    definitions: EquipmentDefinition[],
    equipmentIds?: string[],
  ): EquipmentDefinition[] {
    if (!equipmentIds || !equipmentIds.length) {
      return definitions;
    }

    const set = new Set(equipmentIds.map((id) => String(id)));
    return definitions.filter((definition) => set.has(definition.value));
  }

  private async calculateStepStatistics(params: {
    origin: ProductOrigin;
    stepTypeNo: string;
    range: DateRange;
    equipment?: EquipmentDefinition[];
  }): Promise<StatisticsResult> {
    const definitions = params.equipment?.length
      ? params.equipment
      : this.getEquipmentDefinitions(params.stepTypeNo, params.origin);

    if (!definitions.length) {
      return this.emptyStatistics();
    }

    const prismaClient = this.prisma.getClientByOrigin(params.origin);

    const recordGroups = await Promise.all(
      definitions.map((definition) =>
        this.loadRecordsForDefinition(prismaClient, definition, params.range),
      ),
    );

    const records = recordGroups.flat();

    if (!records.length) {
      return this.emptyStatistics();
    }

    return this.computeStatistics(records);
  }

  private async loadRecordsForDefinition(
    client: PrismaClient,
    definition: EquipmentDefinition,
    range: DateRange,
  ): Promise<NormalizedRecord[]> {
    if (definition.source === 'INFO') {
      const where: Prisma.mo_auto_adjust_infoWhereInput = {
        station_num: definition.stationNum,
        beam_sn: { not: '' },
      };

      const andConditions: Prisma.mo_auto_adjust_infoWhereInput[] = [];

      if (range.start) {
        andConditions.push({
          OR: [
            { operation_time: { gte: range.start } },
            { operation_time: null, add_time: { gte: range.start } },
          ],
        });
      }

      if (range.end) {
        andConditions.push({
          OR: [
            { operation_time: { lte: range.end } },
            { operation_time: null, add_time: { lte: range.end } },
          ],
        });
      }

      if (andConditions.length) {
        where.AND = andConditions;
      }

      const rows = await client.mo_auto_adjust_info.findMany({
        where,
        select: {
          beam_sn: true,
          operation_time: true,
          add_time: true,
          operation_result: true,
        },
      });

      return rows
        .filter((row) => Boolean(row.beam_sn))
        .map((row) => ({
          beamSn: row.beam_sn as string,
          timestamp: this.pickTimestamp(row.operation_time, row.add_time),
          success: row.operation_result === 1,
        }));
    }

    const addTimeCondition: Prisma.DateTimeFilter = {};
    if (range.start) {
      addTimeCondition.gte = range.start;
    }
    if (range.end) {
      addTimeCondition.lte = range.end;
    }

    const rows = await client.mo_auto_adjust_st08.findMany({
      where: {
        beam_sn: { not: '' },
        ...(Object.keys(addTimeCondition).length
          ? { add_time: addTimeCondition }
          : {}),
      },
      select: {
        beam_sn: true,
        add_time: true,
        error_code: true,
      },
    });

    return rows
      .filter((row) => Boolean(row.beam_sn))
      .map((row) => ({
        beamSn: row.beam_sn as string,
        timestamp: row.add_time ?? new Date(0),
        success: (row.error_code ?? 0) === 0,
      }));
  }

  private pickTimestamp(
    operationTime?: Date | null,
    addTime?: Date | null,
  ): Date {
    if (
      operationTime instanceof Date &&
      !Number.isNaN(operationTime.getTime())
    ) {
      return operationTime;
    }

    if (addTime instanceof Date && !Number.isNaN(addTime.getTime())) {
      return addTime;
    }

    return new Date(0);
  }

  private computeStatistics(records: NormalizedRecord[]): StatisticsResult {
    const grouped = new Map<string, NormalizedRecord[]>();

    for (const record of records) {
      if (!record.beamSn) {
        continue;
      }

      if (!grouped.has(record.beamSn)) {
        grouped.set(record.beamSn, []);
      }

      grouped.get(record.beamSn)!.push(record);
    }

    for (const list of grouped.values()) {
      list.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    let firstPassCount = 0;
    let finalPassCount = 0;
    let scrapCount = 0;
    let reworkCount = 0;

    for (const list of grouped.values()) {
      if (!list.length) {
        continue;
      }

      const first = list[0];
      const last = list[list.length - 1];

      if (first.success) {
        firstPassCount += 1;
      }

      if (last.success) {
        finalPassCount += 1;
      } else {
        scrapCount += 1;
      }

      if (list.length > 1) {
        reworkCount += list.length - 1;
      }
    }

    const total = grouped.size;

    return {
      totalOutput: total,
      firstPassRate: total ? firstPassCount / total : 0,
      finalPassRate: total ? finalPassCount / total : 0,
      firstPassCount,
      finalPassCount,
      scrapCount,
      reworkCount,
    };
  }

  private emptyStatistics(): StatisticsResult {
    return {
      totalOutput: 0,
      firstPassRate: 0,
      finalPassRate: 0,
      firstPassCount: 0,
      finalPassCount: 0,
      scrapCount: 0,
      reworkCount: 0,
    };
  }

  private formatDateRange(start?: string, end?: string): string {
    const normalize = (value?: string): string => {
      if (!value) {
        return '';
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return '';
      }
      return trimmed;
    };

    const normalizedStart = normalize(start);
    const normalizedEnd = normalize(end);

    if (normalizedStart && normalizedEnd) {
      if (normalizedStart === normalizedEnd) {
        return normalizedStart;
      }
      return `${normalizedStart} ~ ${normalizedEnd}`;
    }

    return normalizedStart || normalizedEnd;
  }
}
