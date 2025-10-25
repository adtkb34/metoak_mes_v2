import type { ProductOrigin } from "@/enums/product-origin";

export interface DashboardSummaryParams {
  startDate?: string;
  endDate?: string;
  product?: string | null;
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
  product: string;
  stepTypeNo: string;
  deviceNos?: string[];
  stations?: string[];
}

export interface ProcessMetricsSummary {
  数量: {
    良品: number | string;
    产品: number | string;
    执行: number | string;
  };
  良率: {
    一次良率: number | string;
    最终良率: number | string;
    产品良率: number | string;
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
