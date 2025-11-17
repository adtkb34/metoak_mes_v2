import type {
  ParetoChartData as ApiParetoChartData,
  ProcessMetricsSummary as ApiProcessMetricsSummary
} from "@/api/dashboard.types";
import type { ProductOrigin } from "@/enums/product-origin";

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface FilterState {
  dateRange: string[];
  product: string[];
  origin: ProductOrigin | null;
  processCode: string | null;
}

export interface ProcessMetric {
  id: string;
  name: string;
  output: number;
  firstPassYield: number;
  finalYield: number;
  wip: number;
  trend: number;
  targetOutput: number;
}

export type ProcessMetricsSummary = ApiProcessMetricsSummary;
export type ParetoChartData = ApiParetoChartData;

export interface ProcessOverviewItem {
  id: string;
  name: string;
  code: string | null;
  metrics: ProcessMetricsSummary;
  /**
   * Optional label that will be rendered before the card title.
   * Example: "工单号" -> "工单号 123".
   */
  titleLabel?: string;
  /**
   * Optional label/value pair rendered under the title.
   * Defaults to "工序编码" + code if not provided.
   */
  metaLabel?: string;
  metaValue?: string | null;
  /**
   * When present, clicking the card will navigate using this product code.
   */
  targetProductCode?: string | null;
}

export interface DashboardSummaryResponse {
  filters: {
    products: SelectOption[];
    origins: SelectOption[];
  };
  processes: ProcessMetric[];
  workOrders: WorkOrderRow[];
}

export interface WorkOrderRow {
  workOrderCode: string;
  productCodes: string[];
  products: string[];
  metrics: ProcessMetricsSummary;
  origin?: ProductOrigin;
  startDate?: string;
  endDate?: string;
}

export interface DefectBreakdown {
  reason: string;
  count: number;
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
  defects: DefectBreakdown[];
}

export interface ProcessDetailData {
  processId: string;
  processName: string;
  equipmentOptions: SelectOption[];
  stationOptions: SelectOption[];
  rows: ProcessDetailRow[];
  summary?: ProcessMetricsSummary;
}
