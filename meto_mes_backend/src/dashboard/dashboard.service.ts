import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaClient, mo_workstage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProductOrigin,
  PRODUCT_ORIGIN_OPTIONS,
} from '../common/enums/product-origin.enum';

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
  processIds?: string[];
  equipmentIds?: string[];
  stationIds?: string[];
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
    equipmentIds?: string[];
    stationIds?: string[];
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
    const processIds = params.processIds
      ?.map((id) => id?.trim())
      .filter((id): id is string => !!id);

    const identifiers = processIds?.length ? processIds : [''];

    const metrics = identifiers.map((processId) => ({
      processId,
      processName: processId ? `工序 ${processId}` : '工序',
      output: 0,
      firstPassYield: 0,
      finalYield: 0,
      productYield: 0,
    }));

    if (params.origin !== undefined && processIds?.length) {
      const { start, end } = this.normalizeDateRange(
        params.startDate,
        params.endDate,
      );

      try {
        const client = this.prisma.getClientByOrigin(params.origin);
        await Promise.all(
          metrics.map(async (metric) => {
            if (!metric.processId?.trim()) {
              return;
            }

            const data = await this.loadProcessProductionMetrics({
              client,
              stepTypeNo: metric.processId,
              range: { start, end },
            });

            if (!data) {
              return;
            }

            metric.output = data.output;
            metric.firstPassYield = data.firstPassYield;
            metric.finalYield = data.finalYield;
            metric.productYield = data.productYield;
          }),
        );
      } catch (error) {
        this.logger.error(
          `Failed to load process metrics from mo_process_production_result: ${error.message}`,
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
        equipmentIds: params.equipmentIds,
        stationIds: params.stationIds,
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

  private async loadProcessProductionMetrics(params: {
    client: PrismaClient;
    stepTypeNo: string;
    range: DateRange;
  }): Promise<AggregatedProcessMetric | undefined> {
    const { client, stepTypeNo, range } = params;

    const normalizedStep = stepTypeNo?.trim();
    if (!normalizedStep) {
      return undefined;
    }

    let columns: string[] = [];
    try {
      const columnInfo = await client.$queryRaw<{ Field: string }[]>(
        Prisma.sql`SHOW COLUMNS FROM mo_process_production_result;`,
      );
      columns = columnInfo.map((item) => item.Field);
    } catch (error) {
      this.logger.warn(
        `无法获取 mo_process_production_result 的列信息: ${error.message}`,
      );
      return undefined;
    }

    const stepColumn = this.detectColumn(columns, [
      'step_type_no',
      'step_no',
      'process_no',
      /step.*no$/,
      /process.*no$/,
    ]);

    if (!stepColumn) {
      this.logger.warn('mo_process_production_result 表缺少工序编号字段');
      return undefined;
    }

    const timeColumn = this.detectColumn(columns, [
      'stat_date',
      'add_time',
      'start_time',
      'end_time',
      'date',
      /_time$/,
      /_date$/,
    ]);

    const outputColumn = this.detectColumn(columns, [
      'output_qty',
      'output_count',
      'total_output',
      'output',
      'production_qty',
      'production_count',
      'produce_qty',
      'produce_count',
      'product_count',
      /output/,
    ]);

    const firstPassColumn = this.detectColumn(columns, [
      'first_pass_yield',
      'first_pass_rate',
      'first_pass_ratio',
      /first.*yield/,
      /first.*rate/,
    ]);

    const finalYieldColumn = this.detectColumn(columns, [
      'final_yield',
      'final_pass_rate',
      'final_pass_yield',
      'production_yield',
      /final.*yield/,
      /final.*rate/,
      /production.*yield/,
    ]);

    const productYieldColumn = this.detectColumn(columns, [
      'product_yield',
      'product_pass_rate',
      'product_pass_yield',
      /product.*yield/,
      /product.*rate/,
    ]);

    const selectFields: Prisma.Sql[] = [
      Prisma.sql`${Prisma.raw(stepColumn)} AS step`,
    ];

    if (outputColumn) {
      selectFields.push(
        Prisma.sql`${Prisma.raw(outputColumn)} AS output`,
      );
    }

    if (firstPassColumn) {
      selectFields.push(
        Prisma.sql`${Prisma.raw(firstPassColumn)} AS firstPass`,
      );
    }

    if (finalYieldColumn) {
      selectFields.push(
        Prisma.sql`${Prisma.raw(finalYieldColumn)} AS finalYield`,
      );
    }

    if (productYieldColumn) {
      selectFields.push(
        Prisma.sql`${Prisma.raw(productYieldColumn)} AS productYield`,
      );
    }

    const processConditions: Prisma.Sql[] = [
      Prisma.sql`${Prisma.raw(stepColumn)} = ${normalizedStep}`,
    ];

    if (timeColumn) {
      if (range.start) {
        processConditions.push(
          Prisma.sql`${Prisma.raw(timeColumn)} >= ${range.start}`,
        );
      }

      if (range.end) {
        processConditions.push(
          Prisma.sql`${Prisma.raw(timeColumn)} <= ${range.end}`,
        );
      }
    } else if (range.start || range.end) {
      this.logger.warn(
        'mo_process_production_result 表缺少时间字段，已忽略时间筛选条件',
      );
    }

    const whereClause = processConditions.length
      ? Prisma.sql`WHERE ${Prisma.join(processConditions, ' AND ')}`
      : Prisma.sql``;

    type RawRow = {
      step: string | null;
      output?: unknown;
      firstPass?: unknown;
      finalYield?: unknown;
      productYield?: unknown;
    };

    const rows = await client.$queryRaw<RawRow[]>(
      Prisma.sql`
        SELECT ${Prisma.join(selectFields, Prisma.sql`, `)}
        FROM mo_process_production_result
        ${whereClause}
      `,
    );

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

      const outputValue = outputColumn
        ? this.parseNumericValue(row.output)
        : 0;
      const weightBase = outputColumn ? Math.max(outputValue, 0) : 1;
      const effectiveWeight = weightBase > 0 ? weightBase : 1;

      if (outputColumn) {
        state.output += outputValue;
      }

      if (firstPassColumn) {
        const rate = this.parseRate(row.firstPass);
        state.firstPassWeighted += rate * effectiveWeight;
      }

      if (finalYieldColumn) {
        const rate = this.parseRate(row.finalYield);
        state.finalWeighted += rate * effectiveWeight;
      }

      if (productYieldColumn) {
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
      firstPassYield: weight
        ? this.clampRate(state.firstPassWeighted / weight)
        : 0,
      finalYield: weight
        ? this.clampRate(state.finalWeighted / weight)
        : 0,
      productYield: weight
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

      const foundIndex = normalized.findIndex((column) =>
        pattern.test(column),
      );
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
