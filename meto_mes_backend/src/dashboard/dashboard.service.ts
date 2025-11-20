import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient, mo_workstage } from '@prisma/client';
import * as dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProductOrigin,
  PRODUCT_ORIGIN_OPTIONS,
} from '../common/enums/product-origin.enum';
import { STEP_NO } from 'src/utils/stepNo';
import {
  populateAiweishiAANgReasonFromErrorCode,
  populateCalibOrGUanghaojieAANgReasonFromErrorCode,
  populateFQCNgReasonFromErrorCode,
} from '../common/utils/error-reason.util';

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
  workOrderCode?: string | null;
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
  products?: string[];
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

export interface ParetoChartData {
  categories: string[];
  counts: number[];
  cumulative: number[];
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
  start?: string;
  end?: string;
}

interface ProcessMetricLoaderParams {
  product: string | null;
  client: PrismaClient;
  stepTypeNo: string;
  range: DateRange;
  workOrderCode?: string | null;
}

interface ProcessMetricRow {
  product_sn?: string | null;
  error_code?: number | string | null;
  ng_reason?: string | null;
  start_time?: Date | string | null;
  end_time?: Date | string | null;
  station_num?: number | null;
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

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
    const productCode = params.product?.trim();

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

  async getProcessStages(
    processCode: string,
    origin?: ProductOrigin,
  ): Promise<ProcessStageInfo[]> {
    const client = this.prisma.getClientByOrigin(origin);

    const rows = await client.$queryRawUnsafe<
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

  async getStepTypeProcessMetrics(
    origin: number,
    stepTypeNo: string,
    startDate: string,
    endDate: string,
  ): Promise<ProcessMetricsSummary> {
    const summary = this.createEmptyProcessMetricsSummary();
    const normalizedStepTypeNo = stepTypeNo?.trim();

    if (origin === undefined || !normalizedStepTypeNo) {
      return summary;
    }

    try {
      const client = this.prisma.getClientByOrigin(origin);
      let allRows: ProcessMetricRow[] = [];

      const tableMap: Record<
        string,
        { table: string; timeField: string; productSnField: string }[]
      > = {
        [STEP_NO.CALIB]: [
          {
            table: 'mo_calibration',
            timeField: 'start_time',
            productSnField: 'camera_sn',
          },
        ],
        [STEP_NO.AUTO_ADJUST]: [
          {
            table: 'mo_auto_adjust_info',
            timeField: 'add_time',
            productSnField: 'beam_sn',
          },
        ],
        [STEP_NO.FQC]: [
          {
            table: 'mo_final_result',
            timeField: 'check_time',
            productSnField: 'camera_sn',
          },
          {
            table: 'mo_stereo_postcheck',
            timeField: 'datetime',
            productSnField: 'sn',
          },
        ],
      };

      const configList = tableMap[stepTypeNo];
      if (!configList) {
        throw new Error(`Unknown stepTypeNo: ${stepTypeNo}`);
      }

      for (const { table, timeField, productSnField } of configList) {
        // ✅ 安全构造 SQL，字段名用反引号包裹
        const query = Prisma.sql`
          SELECT 
            ${Prisma.raw(`\`${productSnField}\``)} AS product_sn,
            error_code
          FROM 
            ${Prisma.raw(`\`${table}\``)}
          WHERE 
            ${Prisma.raw(`\`${timeField}\``)} BETWEEN ${startDate} AND ${endDate}
        `;

        const rows = await client.$queryRaw<ProcessMetricRow[]>(query);
        allRows.push(...rows);
      }

      // ✅ 聚合处理
      const aggregated = this.aggregateProcessMetricData(allRows);
      return aggregated ?? summary;
    } catch (error) {
      this.logger.error(
        `Failed to load process metrics from mo_process_step_production_result: ${error.message}`,
        error.stack,
      );
      return summary;
    }
  }

  async getWorkOrderProcessMetrics(
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
      let workOrderCode = params.workOrderCode;
      // products = products?.length ? products : [''];

      // if (!products?.length) {
      //   return summary;
      // }

      const client = this.prisma.getClientByOrigin(params.origin);
      let allRows: ProcessMetricRow[] = [];
      // for (const product of products) {
      let rows: ProcessMetricRow[] | undefined;
      if (params.stepTypeNo == STEP_NO.CALIB) {
        rows = await this.fetchCalibMetricRows({
          product: null,
          client,
          stepTypeNo: normalizedStepTypeNo,
          range: { start, end },
          workOrderCode,
        });
      } else if (params.stepTypeNo == STEP_NO.ASSEMBLE_PCBA) {
        rows = await this.fetchAssemblePcbaMetricRows({
          product: null,
          client,
          stepTypeNo: normalizedStepTypeNo,
          range: { start, end },
          workOrderCode,
        });
      } else if (params.stepTypeNo == STEP_NO.AUTO_ADJUST) {
        rows = await this.fetchAutoAdjustMetricRows({
          product: null,
          client,
          stepTypeNo: normalizedStepTypeNo,
          range: { start, end },
          workOrderCode,
        });
      } else if (params.stepTypeNo == STEP_NO.S315FQC) {
        rows = await this.fetchS315FqcMetricRows({
          product: null,
          client,
          stepTypeNo: normalizedStepTypeNo,
          range: { start, end },
          workOrderCode,
        });
      } else if (params.stepTypeNo == STEP_NO.FQC) {
        rows =
          (await this.fetchS315FqcMetricRows({
            product: null,
            client,
            stepTypeNo: normalizedStepTypeNo,
            range: { start, end },
            workOrderCode,
          })) ?? [];
        const rows2 =
          (await this.fetchStereoPostCheckMetricRows({
            product: null,
            client,
            stepTypeNo: normalizedStepTypeNo,
            range: { start, end },
            workOrderCode,
          })) ?? [];
        rows = rows.concat(rows2);
      } else if (params.stepTypeNo == STEP_NO.PACKING) {
        rows = await this.fetchPackingMetricRows({
          product: null,
          client,
          stepTypeNo: normalizedStepTypeNo,
          range: { start, end },
          workOrderCode,
        });
      } else if (params.stepTypeNo == STEP_NO.MO_STEREO_PRECHECK) {
        rows = await this.fetchStereoPrecheckMetricRows({
          product: null,
          client,
          stepTypeNo: normalizedStepTypeNo,
          range: { start, end },
          workOrderCode,
        });
      } else if (params.stepTypeNo == STEP_NO.MO_STEREO_POSTCHECK) {
        rows = await this.fetchStereoPostCheckMetricRows({
          product: null,
          client,
          stepTypeNo: normalizedStepTypeNo,
          range: { start, end },
          workOrderCode,
        });
      } else {
        rows = await this.fetchProcessProductionMetricRows({
          product: null,
          client,
          stepTypeNo: normalizedStepTypeNo,
          range: { start, end },
          workOrderCode,
        });
      }
      if (rows) allRows.push(...rows);
      // }
      const aggregated = allRows
        ? this.aggregateProcessMetricData(allRows)
        : undefined;
      return aggregated ?? summary;
    } catch (error) {
      this.logger.error(
        `Failed to load process metrics from mo_process_step_production_result: ${error.message}`,
        error.stack,
      );
      return summary;
    }
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
      let products = params.products
        ?.map((item) => item?.trim())
        .filter((item): item is string => !!item);

      products = products?.length ? products : [''];

      // if (!products?.length) {
      //   return summary;
      // }
      let workOrderCode = params.workOrderCode;
      const client = this.prisma.getClientByOrigin(params.origin);
      let allRows: ProcessMetricRow[] = [];
      let rows: ProcessMetricRow[] | undefined = [];
      if (workOrderCode) {
        rows = await this.fetchProcessMetrics(
          normalizedStepTypeNo,
          null,
          client,
          start,
          end,
          workOrderCode,
        );
        if (rows) allRows.push(...rows);
      } else {
        for (const product of products) {
          rows = await this.fetchProcessMetrics(
            normalizedStepTypeNo,
            product,
            client,
            start,
            end,
            null,
          );
          if (rows) allRows.push(...rows);
        }
      }

      const aggregated = allRows
        ? this.aggregateProcessMetricData(allRows)
        : undefined;
      return aggregated ?? summary;
    } catch (error) {
      this.logger.error(
        `Failed to load process metrics from mo_process_step_production_result: ${error.message}`,
        error.stack,
      );
      return summary;
    }
  }

  async fetchProcessMetrics(
    stepTypeNo: string,
    product: string | null,
    client,
    start,
    end,
    workOrderCode: string | null,
  ) {
    if (stepTypeNo == STEP_NO.CALIB) {
      return await this.fetchCalibMetricRows({
        product,
        client,
        stepTypeNo,
        range: { start, end },
        workOrderCode,
      });
    } else if (stepTypeNo == STEP_NO.ASSEMBLE_PCBA) {
      return await this.fetchAssemblePcbaMetricRows({
        product,
        client,
        stepTypeNo,
        range: { start, end },
        workOrderCode,
      });
    } else if (stepTypeNo == STEP_NO.AUTO_ADJUST) {
      return await this.fetchAutoAdjustMetricRows({
        product,
        client,
        stepTypeNo,
        range: { start, end },
        workOrderCode,
      });
    } else if (stepTypeNo == STEP_NO.S315FQC) {
      return await this.fetchS315FqcMetricRows({
        product,
        client,
        stepTypeNo,
        range: { start, end },
        workOrderCode,
      });
    } else if (stepTypeNo == STEP_NO.PACKING) {
      return await this.fetchPackingMetricRows({
        product,
        client,
        stepTypeNo,
        range: { start, end },
        workOrderCode,
      });
    } else if (stepTypeNo == STEP_NO.MO_STEREO_PRECHECK) {
      return await this.fetchStereoPrecheckMetricRows({
        product,
        client,
        stepTypeNo,
        range: { start, end },
        workOrderCode,
      });
    } else if (stepTypeNo == STEP_NO.MO_STEREO_POSTCHECK) {
      return await this.fetchStereoPostCheckMetricRows({
        product,
        client,
        stepTypeNo,
        range: { start, end },
        workOrderCode,
      });
    } else {
      return await this.fetchProcessProductionMetricRows({
        product,
        client,
        stepTypeNo,
        range: { start, end },
        workOrderCode,
      });
    }
  }

  async getParetoData(params: {
    products: string[];
    origin: ProductOrigin;
    stepTypeNo: string;
    startDate?: string;
    endDate?: string;
    workOrderCode?: string;
  }): Promise<ParetoChartData> {
    const empty: ParetoChartData = {
      categories: [],
      counts: [],
      cumulative: [],
    };
    console.log(params);
    const stepTypeNo = params.stepTypeNo.trim();

    // if (!product || !stepTypeNo) {
    //   return empty;
    // }

    const { start, end } = this.normalizeDateRange(
      params.startDate,
      params.endDate,
    );

    try {
      const client = this.prisma.getClientByOrigin(params.origin);
      let rows: ProcessMetricRow[] | undefined;
      let allRows: ProcessMetricRow[] = [];
      let workOrderCode = params.workOrderCode;
      for (const product of params.products) {
        if (params.stepTypeNo == STEP_NO.CALIB) {
          rows = await this.fetchCalibMetricRows({
            product,
            client,
            stepTypeNo: stepTypeNo,
            range: { start, end },
            workOrderCode,
          });
          if (rows != undefined) {
            rows = await populateCalibOrGUanghaojieAANgReasonFromErrorCode(
              this.prisma,
              rows,
              'calibration',
            );
          }
        } else if (params.stepTypeNo == STEP_NO.ASSEMBLE_PCBA) {
          rows = await this.fetchAssemblePcbaMetricRows({
            product,
            client,
            stepTypeNo: stepTypeNo,
            range: { start, end },
            workOrderCode,
          });
        } else if (params.stepTypeNo == STEP_NO.AUTO_ADJUST) {
          rows = await this.fetchAutoAdjustMetricRows({
            product,
            client,
            stepTypeNo: stepTypeNo,
            range: { start, end },
            workOrderCode,
          });
          if (params.origin == ProductOrigin.SUZHOU && rows != undefined) {
            rows = await populateCalibOrGUanghaojieAANgReasonFromErrorCode(
              this.prisma,
              rows,
              'AA',
            );
          }
        } else if (params.stepTypeNo == STEP_NO.S315FQC) {
          rows = await this.fetchS315FqcMetricRows({
            product,
            client,
            stepTypeNo: stepTypeNo,
            range: { start, end },
            workOrderCode,
          });
          if (rows != undefined) {
            rows = await populateFQCNgReasonFromErrorCode(this.prisma, rows);
          }
        } else if (params.stepTypeNo == STEP_NO.PACKING) {
          rows = await this.fetchPackingMetricRows({
            product,
            client,
            stepTypeNo: stepTypeNo,
            range: { start, end },
            workOrderCode,
          });
        } else if (params.stepTypeNo == STEP_NO.MO_STEREO_PRECHECK) {
          rows = await this.fetchStereoPrecheckMetricRows({
            product,
            client,
            stepTypeNo: stepTypeNo,
            range: { start, end },
            workOrderCode,
          });

          if (rows != undefined) {
            rows = await populateCalibOrGUanghaojieAANgReasonFromErrorCode(
              this.prisma,
              rows,
              'stereo_precheck',
            );
          }
        } else if (params.stepTypeNo == STEP_NO.MO_STEREO_POSTCHECK) {
          rows = await this.fetchStereoPostCheckMetricRows({
            product,
            client,
            stepTypeNo: stepTypeNo,
            range: { start, end },
            workOrderCode,
          });
          if (rows != undefined) {
            rows = await populateCalibOrGUanghaojieAANgReasonFromErrorCode(
              this.prisma,
              rows,
              'stereo_postcheck',
            );
          }
        } else {
          rows = await this.fetchGenericProcessMetricData({
            product,
            client,
            stepTypeNo,
            range: { start, end },
            workOrderCode,
          });
        }
        if (rows) allRows.push(...rows);
      }

      if (!allRows?.length) {
        return empty;
      }
      if (
        params.origin == ProductOrigin.MIANYANG &&
        params.stepTypeNo in
          [
            STEP_NO.AFTER_AA_COATING_PROCESS_RECORD,
            STEP_NO.AFTER_AA_FINAL_COMPREHENSIVE_INSPECTION,
            STEP_NO.AUTO_ADJUST,
            STEP_NO.BEAM_APPEARANCE_INSPECTION,
            STEP_NO.CMOS_APPEARANCE_INSPECTION,
            STEP_NO.DIRTY_CHECKING,
            STEP_NO.SCREW_TIGHTENING_INSPECTION,
            STEP_NO.HIGH_TEMP_CURING_RECORD,
            STEP_NO.LASER_MARKING_INSPECTION,
          ]
      ) {
        return await populateAiweishiAANgReasonFromErrorCode(
          allRows,
          this.configService,
          stepTypeNo,
        );
      }
      const breakdown = this.buildParetoBreakdown(
        allRows,
        // this.populateNgReasonFromErrorCode(row),
      );

      if (!breakdown.length) {
        return empty;
      }

      const total = breakdown.reduce((sum, item) => sum + item.count, 0);
      let running = 0;
      return {
        categories: breakdown.map((item) => item.reason),
        counts: breakdown.map((item) => item.count),
        cumulative: breakdown.map((item) => {
          running += item.count;
          return total ? Number(((running / total) * 100).toFixed(1)) : 0;
        }),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error ?? '');
      this.logger.warn(
        `Failed to load pareto data for process ${stepTypeNo}: ${message}`,
      );
      return empty;
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

  private async fetchAutoAdjustMetricRows(
    params: ProcessMetricLoaderParams,
  ): Promise<ProcessMetricRow[] | undefined> {
    const { product, client, stepTypeNo, range, workOrderCode } = params;

    const tableAlias = 'mpspr';
    const baseSql = Prisma.sql`
      SELECT ${Prisma.raw(tableAlias)}.beam_sn AS product_sn, ${Prisma.raw(tableAlias)}.error_code, ${Prisma.raw(tableAlias)}.ng_reason, ${Prisma.raw(tableAlias)}.add_time AS start_time, ${Prisma.raw(tableAlias)}.add_time AS end_time, ${Prisma.raw(tableAlias)}.station_num
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
      workOrderCode,
    );

    const tagRows = await this.queryTagInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'beam_sn',
      workOrderCode,
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

    return data;
  }

  private async fetchCalibMetricRows(
    params: ProcessMetricLoaderParams,
  ): Promise<ProcessMetricRow[] | undefined> {
    const { product, client, stepTypeNo, range, workOrderCode } = params;

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
      workOrderCode,
    );

    const tagRows = await this.queryTagInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'camera_sn',
      workOrderCode,
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

    return data;
  }

  private async fetchAssemblePcbaMetricRows(
    params: ProcessMetricLoaderParams,
  ): Promise<ProcessMetricRow[] | undefined> {
    const { product, client, stepTypeNo, range, workOrderCode } = params;

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
      workOrderCode,
    );

    const tagRows = await this.queryTagInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'camera_sn',
      workOrderCode,
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

    return data;
  }

  private async fetchS315FqcMetricRows(
    params: ProcessMetricLoaderParams,
  ): Promise<ProcessMetricRow[] | undefined> {
    const { product, client, stepTypeNo, range, workOrderCode } = params;

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

    let filterClause = Prisma.sql`AND check_type = 'FQC'`;
    if (filterConditions.length > 0) {
      filterClause = Prisma.sql`${filterClause} AND ${Prisma.join(filterConditions, ' AND ')}`;
    }

    const beamRows = await this.queryBeamInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'camera_sn',
      workOrderCode,
    );

    const tagRows = await this.queryTagInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'camera_sn',
      workOrderCode,
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

    return data;
  }

  private async fetchStereoPrecheckMetricRows(
    params: ProcessMetricLoaderParams,
  ): Promise<ProcessMetricRow[] | undefined> {
    const { product, client, stepTypeNo, range, workOrderCode } = params;

    const tableAlias = 'mpspr';
    const baseSql = Prisma.sql`
      SELECT ${Prisma.raw(tableAlias)}.sn AS product_sn, ${Prisma.raw(tableAlias)}.error_code, ${Prisma.raw(tableAlias)}.datetime AS start_time, ${Prisma.raw(tableAlias)}.datetime AS end_time
      FROM mo_stereo_precheck AS ${Prisma.raw(tableAlias)}
    `;

    const filterConditions: Prisma.Sql[] = [];

    const timestampExpr = Prisma.sql`COALESCE(${Prisma.raw(tableAlias)}.datetime)`;
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
      'sn',
      workOrderCode,
    );

    const tagRows = await this.queryTagInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'sn',
      workOrderCode,
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

    return data;
  }

  private async fetchStereoPostCheckMetricRows(
    params: ProcessMetricLoaderParams,
  ): Promise<ProcessMetricRow[] | undefined> {
    const { product, client, stepTypeNo, range, workOrderCode } = params;

    const tableAlias = 'mpspr';
    const baseSql = Prisma.sql`
      SELECT ${Prisma.raw(tableAlias)}.sn AS product_sn, ${Prisma.raw(tableAlias)}.error_code, ${Prisma.raw(tableAlias)}.datetime AS start_time, ${Prisma.raw(tableAlias)}.datetime AS end_time
      FROM mo_stereo_postcheck AS ${Prisma.raw(tableAlias)}
    `;

    const filterConditions: Prisma.Sql[] = [];

    const timestampExpr = Prisma.sql`COALESCE(${Prisma.raw(tableAlias)}.datetime)`;
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
      'sn',
      workOrderCode,
    );

    const tagRows = await this.queryTagInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'sn',
      workOrderCode,
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

    return data;
  }

  private async fetchPackingMetricRows(
    params: ProcessMetricLoaderParams,
  ): Promise<ProcessMetricRow[] | undefined> {
    const { product, client, stepTypeNo, range, workOrderCode } = params;

    const tableAlias = 'mpspr';
    const baseSql = Prisma.sql`
      SELECT ${Prisma.raw(tableAlias)}.camera_sn AS product_sn, ${Prisma.raw(tableAlias)}.start_time, ${Prisma.raw(tableAlias)}.end_time
      FROM mo_packing_info AS ${Prisma.raw(tableAlias)}
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
      workOrderCode,
    );

    const tagRows = await this.queryTagInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'camera_sn',
      workOrderCode,
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

    return data;
  }

  private async fetchProcessProductionMetricRows(
    params: ProcessMetricLoaderParams,
  ): Promise<ProcessMetricRow[] | undefined> {
    const data = await this.fetchGenericProcessMetricData(params);
    if (!data) {
      return undefined;
    }
    return data;
  }

  private async queryBeamInfoProducts(
    client: PrismaClient,
    baseSql: Prisma.Sql, // 基础查询片段，如 SELECT ... FROM ...
    alias: string, // 表别名，例如 "mbi"
    materialCode: string | null, // 物料编号
    filterClause?: Prisma.Sql | null, // 可选额外筛选条件
    productSnName: string = 'product_sn',
    workOrderCode?: string | null, // 工单编号
  ): Promise<ProcessMetricRow[]> {
    let query;
    if (workOrderCode == null || workOrderCode == '') {
      query = Prisma.sql`
        ${baseSql}
        INNER JOIN mo_beam_info AS mbi
          ON mbi.beam_sn = ${Prisma.raw(alias)}.${Prisma.raw(productSnName)}
        INNER JOIN mo_produce_order AS mpo
          ON mpo.work_order_code = mbi.work_order_code
        WHERE  1=1
        ${materialCode ? Prisma.sql`AND mpo.material_code = ${materialCode}` : Prisma.empty}
        ${filterClause ?? Prisma.empty}
      `;
    } else {
      query = Prisma.sql`
        ${baseSql}
        INNER JOIN mo_beam_info AS mbi
          ON mbi.beam_sn = ${Prisma.raw(alias)}.${Prisma.raw(productSnName)}
        WHERE  mbi.work_order_code = ${workOrderCode}
        ${filterClause ?? Prisma.empty}
      `;
    }
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
    materialCode: string | null, // 物料号
    filterClause?: Prisma.Sql | null, // 可选额外筛选条件
    productSnName: string = 'product_sn',
    workOrderCode?: string | null, // 工单编号
  ): Promise<ProcessMetricRow[]> {
    let query;
    if (workOrderCode == null || workOrderCode == '') {
      query = Prisma.sql`
        ${baseSql}
        INNER JOIN mo_tag_info AS mti
          ON mti.tag_sn = ${Prisma.raw(alias)}.${Prisma.raw(productSnName)}
        INNER JOIN mo_produce_order AS mpo
          ON mpo.work_order_code = mti.work_order_code
        WHERE  1=1
      ${materialCode ? Prisma.sql`AND mpo.material_code = ${materialCode}` : Prisma.empty}
          ${filterClause ?? Prisma.empty}
      `;
    } else {
      query = Prisma.sql`
        ${baseSql}
        INNER JOIN mo_tag_info AS mti
          ON mti.tag_sn = ${Prisma.raw(alias)}.${Prisma.raw(productSnName)}
        WHERE  mti.work_order_code = ${workOrderCode}
          ${filterClause ?? Prisma.empty}
      `;
    }
    // 直接执行并返回结果
    const rows = await client.$queryRaw<ProcessMetricRow[]>(query);
    return rows;
  }

  async queryMaterialCodes(
    origin: number,
    stepTypeNo: string,
    startDate: string,
    endDate: string,
  ): Promise<string[]> {
    const client = this.prisma.getClientByOrigin(origin);

    // 定义要循环的来源表和连接字段
    const sources = [
      { table: 'mo_beam_info', joinField: 'beam_sn' },
      { table: 'mo_tag_info', joinField: 'tag_sn' },
    ];

    const results: string[] = [];
    let targetTable;
    let timeField = 'start_time';
    let productSnName = 'camera_sn';

    // ✅ 根据工序号选择表与字段
    if (stepTypeNo === STEP_NO.CALIB) {
      targetTable = 'mo_calibration';
    } else if (stepTypeNo === STEP_NO.S315FQC) {
      targetTable = 'mo_final_result';
      timeField = 'check_time';
    } else if (stepTypeNo === STEP_NO.AUTO_ADJUST) {
      targetTable = 'mo_auto_adjust_info';
      productSnName = 'beam_sn';
      timeField = 'add_time';
    }

    if (!targetTable) return [];

    // ✅ 循环查询不同来源表（mo_beam_info, mo_tag_info）
    for (const src of sources) {
      const safeTargetTable = Prisma.raw(`\`${targetTable}\``);
      const safeSourceTable = Prisma.raw(`\`${src.table}\``);
      const safeJoinField = Prisma.raw(`\`${src.joinField}\``);
      const safeProductSnName = Prisma.raw(`\`${productSnName}\``);
      const safeTimeField = Prisma.raw(`\`${timeField}\``);

      // ✅ 参数化查询，防 SQL 注入
      const query = Prisma.sql`
      SELECT 
        mpo.material_code
      FROM 
        ${safeTargetTable} AS t
        LEFT JOIN ${safeSourceTable} AS s
          ON s.${safeJoinField} = t.${safeProductSnName}
        LEFT JOIN mo_produce_order AS mpo
          ON s.work_order_code = mpo.work_order_code
      WHERE 
        t.${safeTimeField} BETWEEN ${startDate} AND ${endDate}
      GROUP BY 
        mpo.material_code
    `;

      const rows =
        await client.$queryRaw<{ material_code: string | null }[]>(query);

      results.push(...rows.map((r) => r.material_code?.trim() ?? ''));
    }

    return results;
  }

  async queryWorkOrderCodes(
    origin: number,
    stepTypeNo: string,
    startDate: string,
    endDate: string,
  ): Promise<Record<string, string[]>> {
    const client = this.prisma.getClientByOrigin(origin);

    // 来源表（固定）
    const sources = [
      { table: 'mo_beam_info', joinField: 'beam_sn' },
      { table: 'mo_tag_info', joinField: 'tag_sn' },
    ];

    // 工序 → 表映射
    const tableMap: Record<
      string,
      { table: string; timeField: string; productSnField: string }[]
    > = {
      [STEP_NO.CALIB]: [
        {
          table: 'mo_calibration',
          timeField: 'start_time',
          productSnField: 'camera_sn',
        },
      ],
      [STEP_NO.AUTO_ADJUST]: [
        {
          table: 'mo_auto_adjust_info',
          timeField: 'add_time',
          productSnField: 'beam_sn',
        },
      ],
      [STEP_NO.FQC]: [
        {
          table: 'mo_final_result',
          timeField: 'check_time',
          productSnField: 'camera_sn',
        },
        {
          table: 'mo_stereo_postcheck',
          timeField: 'datetime',
          productSnField: 'sn',
        },
      ],
    };

    const targetConfigs = tableMap[stepTypeNo];
    if (!targetConfigs) return {};

    const resultMap: Record<string, Set<string>> = {};

    // ======================================================
    //  🔁 1. 遍历 step 对应的多个目标表
    // ======================================================
    for (const cfg of targetConfigs) {
      const safeTargetTable = Prisma.raw(`\`${cfg.table}\``);
      const safeTimeField = Prisma.raw(`\`${cfg.timeField}\``);
      const safeProductSnField = Prisma.raw(`\`${cfg.productSnField}\``);

      // ======================================================
      //  🔁 2. 遍历多个来源表（mo_beam_info / mo_tag_info）
      // ======================================================
      for (const src of sources) {
        const safeSourceTable = Prisma.raw(`\`${src.table}\``);
        const safeJoinField = Prisma.raw(`\`${src.joinField}\``);

        const query = Prisma.sql`
        SELECT 
          mpo.work_order_code,
          mpo.material_code
        FROM 
          ${safeTargetTable} AS t
          LEFT JOIN ${safeSourceTable} AS s
            ON s.${safeJoinField} = t.${safeProductSnField}
          LEFT JOIN mo_produce_order AS mpo
            ON s.work_order_code = mpo.work_order_code
        WHERE 
          t.${safeTimeField} BETWEEN ${startDate} AND ${endDate}
        GROUP BY 
          mpo.work_order_code, mpo.material_code
      `;

        const rows =
          await client.$queryRaw<
            { work_order_code: string | null; material_code: string | null }[]
          >(query);

        // 聚合
        for (const r of rows) {
          const work = r.work_order_code?.trim();
          const mat = r.material_code?.trim();
          if (!work || !mat) continue;

          if (!resultMap[work]) resultMap[work] = new Set();
          resultMap[work].add(mat);
        }
      }
    }

    // ======================================================
    //  返回普通数组结构
    // ======================================================
    const finalResult: Record<string, string[]> = {};
    for (const key in resultMap) {
      finalResult[key] = [...resultMap[key]];
    }

    return finalResult;
  }

  private async fetchGenericProcessMetricData(
    params: ProcessMetricLoaderParams,
  ): Promise<ProcessMetricRow[] | undefined> {
    const { product, client, stepTypeNo, range, workOrderCode } = params;

    const tableAlias = 'mpspr';
    const baseSql = Prisma.sql`
      SELECT ${Prisma.raw(tableAlias)}.product_sn, ${Prisma.raw(tableAlias)}.error_code, ${Prisma.raw(tableAlias)}.start_time, ${Prisma.raw(tableAlias)}.end_time, ${Prisma.raw(tableAlias)}.ng_reason
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
      'product_sn',
      workOrderCode,
    );

    const tagRows = await this.queryTagInfoProducts(
      client,
      baseSql,
      tableAlias,
      product,
      filterClause,
      'product_sn',
      workOrderCode,
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

  private buildParetoBreakdown(
    rows: ProcessMetricRow[],
    // setNgReason: (row: ProcessMetricRow) => void,
  ): Array<{ reason: string; count: number }> {
    if (!rows.length) {
      return [];
    }

    const counter = new Map<string, number>();

    for (const row of rows) {
      if (this.isSuccessCode(row.error_code)) {
        continue;
      }

      // try {
      //   setNgReason(row);
      // } catch (error) {
      //   const message =
      //     error instanceof Error ? error.message : String(error ?? '');
      //   this.logger.warn(
      //     `Failed to map NG reason for product ${row.product_sn ?? ''}: ${message}`,
      //   );
      // }

      const reason =
        typeof row.ng_reason === 'string' ? row.ng_reason.trim() : undefined;

      if (!reason) {
        continue;
      }

      counter.set(reason, (counter.get(reason) ?? 0) + 1);
    }

    return [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([reason, count]) => ({ reason, count }));
  }

  // private populateNgReasonFromErrorCode(row: ProcessMetricRow): void {
  //   if (typeof row.ng_reason === 'string') {
  //     row.ng_reason = row.ng_reason.trim();
  //     if (row.ng_reason) {
  //       return;
  //     }
  //   }

  //   const code = row.error_code;

  //   if (code === null || code === undefined) {
  //     row.ng_reason = '';
  //     return;
  //   }

  //   if (typeof code === 'string') {
  //     row.ng_reason = code.trim();
  //     return;
  //   }

  //   if (typeof code === 'number') {
  //     row.ng_reason = code === 0 ? '' : String(code);
  //     return;
  //   }

  //   if (typeof code === 'bigint') {
  //     row.ng_reason = code === BigInt(0) ? '' : code.toString();
  //     return;
  //   }

  //   row.ng_reason = '';
  // }

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
      return true;
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
    ): string | undefined => {
      if (!value) return undefined;
      const trimmed = value.trim();
      if (!trimmed) return undefined;

      // 如果是 YYYY-MM-DD 格式
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return kind === 'start' ? `${trimmed} 00:00:00` : `${trimmed} 23:59:59`;
      }

      // 其他情况直接返回原始字符串
      return trimmed;
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
    const normalizedStart =
      this.normalizeDate('start', start) ?? start?.trim() ?? '';
    const normalizedEnd = this.normalizeDate('end', end) ?? end?.trim() ?? '';

    if (normalizedStart && normalizedEnd) {
      if (normalizedStart === normalizedEnd) {
        return normalizedStart;
      }
      return `${normalizedStart} ~ ${normalizedEnd}`;
    }

    return normalizedStart || normalizedEnd;
  }
}
