import { Injectable, Logger } from '@nestjs/common';
import { Prisma, PrismaClient, mo_workstage } from '@prisma/client';
import * as dayjs from 'dayjs';
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

// interface ProcessMetricRow {
//   id: string;
//   name: string;
//   output: number;
//   firstPassYield: number;
//   finalYield: number;
//   wip: number;
//   trend: number;
//   targetOutput: number;
// }

export interface DashboardSummaryResult {
  filters: {
    products: ProductOption[];
    origins: Array<{ label: string; value: ProductOrigin }>;
  };
  processes: ProcessMetricRow[];
  workOrders: Array<Record<string, unknown>>;
}

export interface ProcessStageInfo {
  stageCode: string | null;
  stageName: string | null;
  sysStepTypeNo: string | null;
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

export interface ProcessMetricsSummary {
  数量: {
    良品: number | string;
    产品: number | string;
    总体: number | string;
  };
  良率: {
    一次: number | string;
    最终: number | string;
    总体: number | string;
  };
  良品用时: {
    mean: number | string;
    min: number | string;
    max: number | string;
  };
}

type AggregatedProcessMetric = ProcessMetricsSummary;

const DEFAULT_METRIC_VALUE = '-';

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

interface ProcessMetricRow {
  product_sn?: string | null;
  error_code?: number | string | null;
  ng_reason?: string | null;
  start_time?: Date | string | null;
  end_time?: Date | string | null;
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
      product_sn: '',
      error_code: '',
      start_time: '',
      end_time: '',
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

  async getProcessStages(processCode: string): Promise<ProcessStageInfo[]> {
    const rows = await this.prisma.$queryRawUnsafe<
      { stageCode: string; stage_name: string; step_type_no: string }[]
    >(`
  SELECT mw.stage_code, mw.stage_name, mw.step_type_no
  FROM mo_workstage mw
  LEFT JOIN mo_process_flow mpf
    ON mpf.stage_code = mw.stage_code
  WHERE mpf.process_code = ${processCode}
  ORDER BY mpf.id ASC
`);
    return rows.map((r) => ({
      stageCode: r.stageCode?.trim() ?? null,
      stageName: r.stage_name?.trim() ?? null,
      sysStepTypeNo: r.step_type_no?.trim() ?? null,
    }));
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
  ): Promise<ProcessMetricsSummary> {
    const summary = this.createEmptyProcessMetricsSummary();
    const normalizedStepTypeNo = params.stepTypeNo?.trim();

    if (params.origin === undefined || !normalizedStepTypeNo) {
      return summary;
    }

    const { start, end } = this.normalizeDateRange(
      params.startDate,
      params.endDate,
    );

    try {
      const client = this.prisma.getClientByOrigin(params.origin);
      const product = params.product;
      let data;
      if (params.stepTypeNo == STEP_NO.CALIB) {
        data = await this.loadCalibMetrics({
          product,
          client,
          stepTypeNo: normalizedStepTypeNo,
          range: { start, end },
        });
      } else if (params.stepTypeNo == STEP_NO.ASSEMBLE_PCBA) {
        data = await this.loadAssemblePcbaMetrics({
          product,
          client,
          stepTypeNo: normalizedStepTypeNo,
          range: { start, end },
        });
      } else if (params.stepTypeNo == STEP_NO.AUTO_ADJUST) {
        data = await this.loadAutoAdjustMetrics({
          product,
          client,
          stepTypeNo: normalizedStepTypeNo,
          range: { start, end },
        });
      } else if (params.stepTypeNo == STEP_NO.S315FQC) {
        data = await this.loadS315FqcMetrics({
          product,
          client,
          stepTypeNo: normalizedStepTypeNo,
          range: { start, end },
        });
      } else {
        data = await this.loadProcessProductionMetrics({
          product,
          client,
          stepTypeNo: normalizedStepTypeNo,
          range: { start, end },
        });
      }

      console.log(data);
      return data ?? summary;
    } catch (error) {
      this.logger.error(
        `Failed to load process metrics from mo_process_step_production_result: ${error.message}`,
        error.stack,
      );
      return summary;
    }
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

    const normalizedStart = this.normalizeDate('start', startDate);
    const normalizedEnd = this.normalizeDate('end', endDate);

    const now = dayjs();
    const fallbackStartDate = now.subtract(1, 'year').startOf('day');
    const fallbackEndDate = now.endOf('day');
    const fallbackStart = fallbackStartDate.format('YYYY-MM-DD HH:mm:ss');
    const fallbackEnd = fallbackEndDate.format('YYYY-MM-DD HH:mm:ss');

    let startBoundary = fallbackStart;
    if (normalizedStart) {
      const parsedStart = dayjs(normalizedStart);
      if (parsedStart.isValid() && parsedStart.isAfter(fallbackStartDate)) {
        startBoundary = normalizedStart;
      }
    }

    let endBoundary = normalizedEnd ?? fallbackEnd;
    let parsedEnd = dayjs(endBoundary);
    if (!parsedEnd.isValid()) {
      endBoundary = fallbackEnd;
      parsedEnd = dayjs(endBoundary);
    }

    const parsedStart = dayjs(startBoundary);
    if (parsedEnd.isBefore(parsedStart)) {
      endBoundary = parsedStart.endOf('day').format('YYYY-MM-DD HH:mm:ss');
    }

    const orderTimestampExpr = Prisma.sql`
      COALESCE(
        mpo.planned_starttime,
        mpo.added_time,
        CAST(mpo.order_date AS DATETIME)
      )
    `;

    const conditions: Prisma.Sql[] = [
      Prisma.sql`mpo.material_name IS NOT NULL`,
      Prisma.sql`mpo.material_code IS NOT NULL`,
      Prisma.sql`${orderTimestampExpr} IS NOT NULL`,
      Prisma.sql`${orderTimestampExpr} >= ${startBoundary}`,
    ];

    if (endBoundary) {
      conditions.push(Prisma.sql`${orderTimestampExpr} <= ${endBoundary}`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    try {
      const rows = await prismaClient.$queryRaw<
        { material_name: string | null; material_code: string | null }[]
      >(Prisma.sql`
        SELECT DISTINCT
          mpo.material_name,
          mpo.material_code
        FROM mo_produce_order AS mpo
        ORDER BY mpo.material_name, mpo.material_code;
      `);

      const unique = new Map<string, ProductOption>();
      for (const row of rows) {
        const name = row.material_name?.trim();
        const code = row.material_code?.trim();
        if (!code || unique.has(code)) {
          continue;
        }
        const label = name ? `${name} (${code})` : code;
        unique.set(code, { label, code });
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

  private async loadAutoAdjustMetrics(
    params: ProcessMetricLoaderParams,
  ): Promise<AggregatedProcessMetric | undefined> {
    const { product, client, stepTypeNo, range } = params;
    if (!product) {
      return undefined;
    }

    const tableAlias = 'mpspr';
    const baseSql = Prisma.sql`
      SELECT ${Prisma.raw(tableAlias)}.beam_sn AS product_sn, ${Prisma.raw(tableAlias)}.error_code, ${Prisma.raw(tableAlias)}.add_time AS start_time, ${Prisma.raw(tableAlias)}.add_time AS end_time
      FROM mo_auto_adjust_info AS ${Prisma.raw(tableAlias)}
    `;

    const filterConditions: Prisma.Sql[] = [];

    const timestampExpr = Prisma.sql`COALESCE(${Prisma.raw(tableAlias)}.add_time)`;
    if (range.start) {
      filterConditions.push(Prisma.sql`${timestampExpr} >= ${range.start}`);
    }

    if (range.end) {
      filterConditions.push(Prisma.sql`${timestampExpr} <= ${range.end}`);
    }

    const filterClause =
      filterConditions.length > 0
        ? Prisma.sql`AND ${Prisma.join(filterConditions, ' AND ')}`
        : Prisma.empty;

    const beamRows = await this.queryBeamInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'beam_sn',
    );

    const tagRows = await this.queryTagInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'beam_sn',
    );

    const combined = [...beamRows, ...tagRows];
    if (!combined.length) {
      return undefined;
    }

    const unique = new Map<string, ProcessMetricRow>();
    for (const row of combined) {
      const key = this.buildProcessMetricRowKey(row);
      if (!unique.has(key)) {
        unique.set(key, row);
      }
    }

    const data = [...unique.values()];
    if (!data) {
      return undefined;
    }
    //
    return this.aggregateProcessMetricData(data);
  }

  private async loadCalibMetrics(
    params: ProcessMetricLoaderParams,
  ): Promise<AggregatedProcessMetric | undefined> {
    const { product, client, stepTypeNo, range } = params;
    if (!product) {
      return undefined;
    }

    const tableAlias = 'mpspr';
    const baseSql = Prisma.sql`
      SELECT ${Prisma.raw(tableAlias)}.camera_sn AS product_sn, ${Prisma.raw(tableAlias)}.error_code, ${Prisma.raw(tableAlias)}.start_time, ${Prisma.raw(tableAlias)}.end_time
      FROM mo_calibration AS ${Prisma.raw(tableAlias)}
    `;

    const filterConditions: Prisma.Sql[] = [];

    const timestampExpr = Prisma.sql`COALESCE(${Prisma.raw(tableAlias)}.start_time)`;
    if (range.start) {
      filterConditions.push(Prisma.sql`${timestampExpr} >= ${range.start}`);
    }

    if (range.end) {
      filterConditions.push(Prisma.sql`${timestampExpr} <= ${range.end}`);
    }

    const filterClause =
      filterConditions.length > 0
        ? Prisma.sql`AND ${Prisma.join(filterConditions, ' AND ')}`
        : Prisma.empty;

    const beamRows = await this.queryBeamInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'camera_sn',
    );

    const tagRows = await this.queryTagInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'camera_sn',
    );

    const combined = [...beamRows, ...tagRows];
    if (!combined.length) {
      return undefined;
    }

    const unique = new Map<string, ProcessMetricRow>();
    for (const row of combined) {
      const key = this.buildProcessMetricRowKey(row);
      if (!unique.has(key)) {
        unique.set(key, row);
      }
    }

    const data = [...unique.values()];
    if (!data) {
      return undefined;
    }
    //
    return this.aggregateProcessMetricData(data);
  }

  private async loadAssemblePcbaMetrics(
    params: ProcessMetricLoaderParams,
  ): Promise<AggregatedProcessMetric | undefined> {
    const { product, client, stepTypeNo, range } = params;
    if (!product) {
      return undefined;
    }

    const tableAlias = 'mpspr';
    const baseSql = Prisma.sql`
      SELECT ${Prisma.raw(tableAlias)}.camera_sn AS product_sn, ${Prisma.raw(tableAlias)}.start_time, ${Prisma.raw(tableAlias)}.end_time
      FROM mo_assemble_info AS ${Prisma.raw(tableAlias)}
    `;

    const filterConditions: Prisma.Sql[] = [];

    const timestampExpr = Prisma.sql`COALESCE(${Prisma.raw(tableAlias)}.start_time)`;
    if (range.start) {
      filterConditions.push(Prisma.sql`${timestampExpr} >= ${range.start}`);
    }

    if (range.end) {
      filterConditions.push(Prisma.sql`${timestampExpr} <= ${range.end}`);
    }

    const filterClause =
      filterConditions.length > 0
        ? Prisma.sql`AND ${Prisma.join(filterConditions, ' AND ')}`
        : Prisma.empty;

    const beamRows = await this.queryBeamInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'camera_sn',
    );

    const tagRows = await this.queryTagInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'camera_sn',
    );

    const combined = [...beamRows, ...tagRows];
    if (!combined.length) {
      return undefined;
    }

    const unique = new Map<string, ProcessMetricRow>();
    for (const row of combined) {
      const key = this.buildProcessMetricRowKey(row);
      if (!unique.has(key)) {
        unique.set(key, row);
      }
    }

    const data = [...unique.values()];
    if (!data) {
      return undefined;
    }
    //
    return this.aggregateProcessMetricData(data);
  }

  private async loadS315FqcMetrics(
    params: ProcessMetricLoaderParams,
  ): Promise<AggregatedProcessMetric | undefined> {
    const { product, client, stepTypeNo, range } = params;
    if (!product) {
      return undefined;
    }

    const tableAlias = 'mpspr';
    const baseSql = Prisma.sql`
      SELECT ${Prisma.raw(tableAlias)}.camera_sn AS product_sn, ${Prisma.raw(tableAlias)}.error_code, ${Prisma.raw(tableAlias)}.check_time AS start_time, ${Prisma.raw(tableAlias)}.check_time AS end_time
      FROM mo_final_result AS ${Prisma.raw(tableAlias)}
    `;

    const filterConditions: Prisma.Sql[] = [];

    const timestampExpr = Prisma.sql`COALESCE(${Prisma.raw(tableAlias)}.check_time)`;
    if (range.start) {
      filterConditions.push(Prisma.sql`${timestampExpr} >= ${range.start}`);
    }

    if (range.end) {
      filterConditions.push(Prisma.sql`${timestampExpr} <= ${range.end}`);
    }

    const filterClause =
      filterConditions.length > 0
        ? Prisma.sql`AND ${Prisma.join(filterConditions, ' AND ')}`
        : Prisma.empty;

    const beamRows = await this.queryBeamInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'camera_sn',
    );

    const tagRows = await this.queryTagInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'camera_sn',
    );

    const combined = [...beamRows, ...tagRows];
    if (!combined.length) {
      return undefined;
    }
    const unique = new Map<string, ProcessMetricRow>();
    for (const row of combined) {
      const key = this.buildProcessMetricRowKey(row);
      if (!unique.has(key)) {
        unique.set(key, row);
      }
    }

    const data = [...unique.values()];
    if (!data) {
      return undefined;
    }
    //
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
    productSnName: string = 'product_sn',
  ): Promise<ProcessMetricRow[]> {
    const query = Prisma.sql`
    ${baseSql}
    INNER JOIN mo_beam_info AS mbi
      ON mbi.beam_sn = ${Prisma.raw(alias)}.${Prisma.raw(productSnName)}
    INNER JOIN mo_produce_order AS mpo
      ON mpo.work_order_code = mbi.work_order_code
    WHERE mpo.material_code = ${materialCode}
    ${filterClause ?? Prisma.empty}
  `;

    const rows = await client.$queryRaw<ProcessMetricRow[]>(query);

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
    productSnName: string = 'product_sn',
  ): Promise<ProcessMetricRow[]> {
    const query = Prisma.sql`
    ${baseSql}
    INNER JOIN mo_tag_info AS mti
      ON mti.tag_sn = ${Prisma.raw(alias)}.${Prisma.raw(productSnName)}
    INNER JOIN mo_produce_order AS mpo
      ON mpo.work_order_code = mti.work_order_code
    WHERE mpo.material_code = ${materialCode}
    ${filterClause ?? Prisma.empty}
  `;

    // 直接执行并返回结果
    const rows = await client.$queryRaw<ProcessMetricRow[]>(query);
    return rows;
  }

  private async fetchGenericProcessMetricData(
    params: ProcessMetricLoaderParams,
  ): Promise<ProcessMetricRow[] | undefined> {
    const { product, client, stepTypeNo, range } = params;
    if (!product) {
      return undefined;
    }

    const tableAlias = 'mpspr';
    const baseSql = Prisma.sql`
      SELECT ${Prisma.raw(tableAlias)}.product_sn, ${Prisma.raw(tableAlias)}.error_code, ${Prisma.raw(tableAlias)}.start_time, ${Prisma.raw(tableAlias)}.end_time
      FROM mo_process_step_production_result AS ${Prisma.raw(tableAlias)}
    `;

    const filterConditions: Prisma.Sql[] = [
      Prisma.sql`${Prisma.raw(tableAlias)}.step_type_no = ${stepTypeNo}`,
    ];

    const timestampExpr = Prisma.sql`COALESCE(${Prisma.raw(
      tableAlias,
    )}.add_time, ${Prisma.raw(tableAlias)}.start_time)`;
    if (range.start) {
      filterConditions.push(Prisma.sql`${timestampExpr} >= ${range.start}`);
    }

    if (range.end) {
      filterConditions.push(Prisma.sql`${timestampExpr} <= ${range.end}`);
    }

    const filterClause =
      filterConditions.length > 0
        ? Prisma.sql`AND ${Prisma.join(filterConditions, ' AND ')}`
        : Prisma.empty;

    const beamRows = await this.queryBeamInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
    );

    const tagRows = await this.queryTagInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
    );

    const combined = [...beamRows, ...tagRows];
    if (!combined.length) {
      return undefined;
    }

    const unique = new Map<string, ProcessMetricRow>();
    for (const row of combined) {
      const key = this.buildProcessMetricRowKey(row);
      if (!unique.has(key)) {
        unique.set(key, row);
      }
    }

    return [...unique.values()];
  }

  private aggregateProcessMetricData(
    rows: ProcessMetricRow[],
  ): AggregatedProcessMetric | undefined {
    if (!rows.length) {
      return undefined;
    }

    const grouped = new Map<string, ProcessMetricRow[]>();
    for (const row of rows) {
      const productSn = row.product_sn?.trim();
      if (!productSn) {
        continue;
      }

      if (!grouped.has(productSn)) {
        grouped.set(productSn, []);
      }

      grouped.get(productSn)!.push(row);
    }

    if (!grouped.size) {
      return undefined;
    }

    let finalGoodCount = 0;
    let firstPassSuccess = 0;
    let finalPassSuccess = 0;
    let anySuccess = 0;
    const goodDurations: number[] = [];

    for (const [, entries] of grouped) {
      entries.sort((a, b) => {
        const timeA = this.extractSortableTime(a);
        const timeB = this.extractSortableTime(b);
        return timeA - timeB;
      });

      const hasSuccessfulAttempt = entries.some((item) =>
        this.isSuccessCode(item.error_code),
      );
      if (hasSuccessfulAttempt) {
        anySuccess += 1;
      }

      const firstEntry = entries[0];
      if (firstEntry && this.isSuccessCode(firstEntry.error_code)) {
        firstPassSuccess += 1;
      }

      const lastEntry = entries[entries.length - 1];
      if (lastEntry && this.isSuccessCode(lastEntry.error_code)) {
        finalPassSuccess += 1;
        finalGoodCount += 1;
      }

      for (const entry of entries) {
        if (!this.isSuccessCode(entry.error_code)) {
          continue;
        }
        const duration = this.calculateDurationSeconds(
          entry.start_time,
          entry.end_time,
        );
        if (duration !== undefined) {
          goodDurations.push(duration);
        }
      }
    }

    const productCount = grouped.size;
    const durationStats = this.computeDurationStatistics(goodDurations);

    return {
      数量: {
        良品: finalGoodCount || DEFAULT_METRIC_VALUE,
        产品: productCount || DEFAULT_METRIC_VALUE,
        总体: rows.length || DEFAULT_METRIC_VALUE,
      },
      良率: {
        一次:
          productCount > 0 && firstPassSuccess > 0
            ? this.clampRate(firstPassSuccess / productCount)
            : DEFAULT_METRIC_VALUE,
        总体:
          rows.length > 0 && anySuccess > 0
            ? this.clampRate(anySuccess / rows.length)
            : DEFAULT_METRIC_VALUE,
        最终:
          productCount > 0 && finalPassSuccess > 0
            ? this.clampRate(finalPassSuccess / productCount)
            : DEFAULT_METRIC_VALUE,
      },
      良品用时: durationStats,
    };
  }

  private createEmptyProcessMetricsSummary(): ProcessMetricsSummary {
    return {
      数量: {
        良品: DEFAULT_METRIC_VALUE,
        产品: DEFAULT_METRIC_VALUE,
        总体: DEFAULT_METRIC_VALUE,
      },
      良率: {
        一次: DEFAULT_METRIC_VALUE,
        最终: DEFAULT_METRIC_VALUE,
        总体: DEFAULT_METRIC_VALUE,
      },
      良品用时: {
        mean: DEFAULT_METRIC_VALUE,
        min: DEFAULT_METRIC_VALUE,
        max: DEFAULT_METRIC_VALUE,
      },
    };
  }

  private buildProcessMetricRowKey(row: ProcessMetricRow): string {
    const productSn = row.product_sn?.trim() ?? '';
    const start = this.serializeDateForKey(row.start_time);
    const end = this.serializeDateForKey(row.end_time);
    const errorCode = row.error_code ?? '';
    return `${productSn}|${start}|${end}|${errorCode}`;
  }

  private extractSortableTime(row: ProcessMetricRow): number {
    const start = this.toDate(row.start_time);
    const end = this.toDate(row.end_time);
    const timestamp = start ?? end;
    if (!timestamp) {
      return 0;
    }
    return timestamp.getTime();
  }

  private calculateDurationSeconds(
    start: Date | string | null | undefined,
    end: Date | string | null | undefined,
  ): number | undefined {
    const startDate = this.toDate(start);
    const endDate = this.toDate(end);
    if (!startDate || !endDate) {
      return undefined;
    }

    const diff = (endDate.getTime() - startDate.getTime()) / 1000;
    if (!Number.isFinite(diff) || diff < 0) {
      return undefined;
    }

    return diff;
  }

  private computeDurationStatistics(values: number[]): {
    mean: number;
    min: number;
    max: number;
  } {
    if (!values.length) {
      return { mean: 0, min: 0, max: 0 };
    }

    let sum = 0;
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (const value of values) {
      sum += value;
      if (value < min) {
        min = value;
      }
      if (value > max) {
        max = value;
      }
    }

    return {
      mean: sum / values.length,
      min,
      max,
    };
  }

  private serializeDateForKey(value: Date | string | null | undefined): string {
    const date = this.toDate(value);
    if (!date) {
      return '';
    }
    return date.toISOString();
  }

  private toDate(value: unknown): Date | undefined {
    if (!value) {
      return undefined;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? undefined : value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }
      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }

    return undefined;
  }

  private isSuccessCode(value: unknown): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'number') {
      return value === 0;
    }

    if (typeof value === 'string') {
      return value.trim() === '0';
    }

    if (typeof value === 'bigint') {
      return value === BigInt(0);
    }

    return false;
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
