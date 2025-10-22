import type { ProductOrigin } from "@/enums/product-origin";

export interface DashboardSummaryParams {
  startDate?: string;
  endDate?: string;
  product?: string | null;
  origins?: ProductOrigin[];
}

export interface ProcessDetailParams extends DashboardSummaryParams {
  processId: string;
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
