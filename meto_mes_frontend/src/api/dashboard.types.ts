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

export interface DashboardProductsParams {
  startDate?: string;
  endDate?: string;
  origin?: ProductOrigin;
}

export interface DashboardProductOption {
  label: string;
  code: string;
}
