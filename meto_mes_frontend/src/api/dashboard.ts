import { http } from "@/utils/http";
import type {
  DashboardSummaryResponse,
  ProcessDetailData
} from "@/views/dashboard/types";

export interface DashboardSummaryParams {
  startDate?: string;
  endDate?: string;
  product?: string | null;
  origins?: string[];
}

export interface ProcessDetailParams extends DashboardSummaryParams {
  processId: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const DASHBOARD_SUMMARY_URL = "/dashboard/summary";
const PROCESS_DETAIL_URL = "/dashboard/process-detail";

function unwrapResponse<T>(response: ApiResponse<T>, defaultMessage: string): T {
  if (!response.success) {
    throw new Error(response.message ?? defaultMessage);
  }
  if (response.data === undefined) {
    throw new Error(defaultMessage);
  }
  return response.data;
}

export async function fetchDashboardSummary(
  params: DashboardSummaryParams
): Promise<DashboardSummaryResponse> {
  const response = await http.request<ApiResponse<DashboardSummaryResponse>>(
    "post",
    DASHBOARD_SUMMARY_URL,
    { data: params }
  );
  return unwrapResponse(response, "获取仪表盘数据失败");
}

export async function fetchProcessDetail(
  params: ProcessDetailParams
): Promise<ProcessDetailData> {
  const response = await http.request<ApiResponse<ProcessDetailData>>(
    "post",
    PROCESS_DETAIL_URL,
    { data: params }
  );
  return unwrapResponse(response, "获取工序详情失败");
}
