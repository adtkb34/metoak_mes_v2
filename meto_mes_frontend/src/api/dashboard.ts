import { http } from "@/utils/http";
import type {
  DashboardSummaryResponse,
  ProcessDetailData
} from "@/views/dashboard/types";
import {
  buildDashboardSummary,
  buildProcessDetail
} from "./dashboard-mock";
import type {
  DashboardSummaryParams,
  ProcessDetailParams
} from "./dashboard.types";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const DASHBOARD_SUMMARY_URL = "/dashboard/summary";
const PROCESS_DETAIL_URL = "/dashboard/process-detail";

const isMockEnabled = (() => {
  const flag = import.meta.env.VITE_USE_DASHBOARD_MOCK;
  if (typeof flag === "boolean") return flag;
  return String(flag).toLowerCase() === "true";
})();

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
  if (isMockEnabled) {
    return Promise.resolve(buildDashboardSummary(params));
  }
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
  if (isMockEnabled) {
    return Promise.resolve(buildProcessDetail(params));
  }
  const response = await http.request<ApiResponse<ProcessDetailData>>(
    "post",
    PROCESS_DETAIL_URL,
    { data: params }
  );
  return unwrapResponse(response, "获取工序详情失败");
}

export type { DashboardSummaryParams, ProcessDetailParams };
