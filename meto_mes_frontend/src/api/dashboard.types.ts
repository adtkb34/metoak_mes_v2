import type { ProductOrigin } from "@/enums/product-origin";

export interface DashboardSummaryParams {
  startDate?: string;
  endDate?: string;
  product?: string[];
  origin?: ProductOrigin;
  stepTypeNo?: string;
}

export interface ProcessDetailParams extends DashboardSummaryParams {
  processId: string;
  equipmentIds?: string[];
}

export interface ProcessMetricsParams {
  startDate?: string;
  endDate?: string;
  origin?: ProductOrigin;
  product?: string[];
  stepTypeNo: string;
  deviceNos?: string[];
  stations?: string[];
  workOrderCode: string;
}

export interface WorkOrderCodeParams {
  origin: ProductOrigin;
  stepTypeNo: string;
  startDate: string;
  endDate: string;
}

export type WorkOrderCodeMap = Record<string, string[]>;

export interface WorkOrderProcessMetricsParams extends ProcessMetricsParams {
  workOrderCode: string;
}

export interface ParetoChartParams {
  product: string[];
  origin: ProductOrigin;
  stepTypeNo: string;
  startDate?: string;
  endDate?: string;
}

export interface ParetoChartData {
  categories: string[];
  counts: number[];
  cumulative: number[];
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

export interface DashboardProductsParams {
  startDate?: string;
  endDate?: string;
  origin?: ProductOrigin;
}

export interface DashboardProductOption {
  label: string;
  code: string;
}

export interface ProcessStageInfoParams {
  processCode: string;
  origin?: ProductOrigin | null;
}

export interface ProcessStageInfo {
  stageCode: string | null;
  stageName: string | null;
  sysStepTypeNo: string | null;
}

export interface MaterialCodeParams {
  origin: ProductOrigin;
  stepTypeNo: string;
  startDate: string;
  endDate: string;
}
