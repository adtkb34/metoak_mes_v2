import type { ProductOrigin } from "@/enums/product-origin";

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface FilterState {
  dateRange: string[];
  product: string | null;
  origin: ProductOrigin | null;
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

export interface DashboardSummaryResponse {
  filters: {
    products: SelectOption[];
    origins: SelectOption[];
  };
  processes: ProcessMetric[];
  workOrders: WorkOrderRow[];
}

export interface WorkOrderRow {
  orderId: string;
  description: string;
  expectedQuantity: number;
  aaPass: number;
  calibrationPass: number;
  finalPass: number;
  product: string;
  origin: ProductOrigin;
  startDate: string;
  dueDate: string;
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
}
