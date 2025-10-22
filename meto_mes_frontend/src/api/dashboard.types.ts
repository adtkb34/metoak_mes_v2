export interface DashboardSummaryParams {
  startDate?: string;
  endDate?: string;
  product?: string | null;
  origins?: string[];
}

export interface ProcessDetailParams extends DashboardSummaryParams {
  processId: string;
}
