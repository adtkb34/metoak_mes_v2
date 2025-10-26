import { http } from "@/utils/http";
import type {
  DashboardSummaryResponse,
  ProcessDetailData
} from "@/views/dashboard/types";
import {
  buildDashboardSummary,
  buildProcessDetail,
  buildDashboardProducts,
  buildProcessMetrics,
  buildParetoData
} from "./dashboard-mock";
import type {
  DashboardSummaryParams,
  ProcessDetailParams,
  DashboardProductsParams,
  DashboardProductOption,
  ProcessMetricsParams,
  ProcessMetricsSummary,
  ProcessStageInfoParams,
  ProcessStageInfo,
  ParetoChartParams,
  ParetoChartData
} from "./dashboard.types";
import { fa } from "element-plus/es/locale/index.mjs";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const DASHBOARD_SUMMARY_URL = "/dashboard/summary";
const PROCESS_DETAIL_URL = "/dashboard/process-detail";
const DASHBOARD_PRODUCTS_URL = "/dashboard/products";
const PROCESS_METRICS_URL = "/dashboard/process-metrics";
const PROCESS_STAGE_INFO_URL = "/dashboard/process-stage-info";
const PROCESS_PARETO_URL = "/dashboard/pareto";

const isMockEnabled = (() => {
  const flag = false;
  if (typeof flag === "boolean") return flag;
  return String(flag).toLowerCase() === "true";
})();

function unwrapResponse<T>(
  response: ApiResponse<T>,
  defaultMessage: string
): T {
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
  console.log(response);
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

export async function fetchDashboardProducts(
  params: DashboardProductsParams
): Promise<DashboardProductOption[]> {
  if (isMockEnabled) {
    return Promise.resolve(buildDashboardProducts(params));
  }

  const response = await http.request<ApiResponse<DashboardProductOption[]>>(
    "get",
    DASHBOARD_PRODUCTS_URL,
    { params }
  );
  console.log(response);
  return unwrapResponse(response, "获取产品选项失败");
}

export async function fetchProcessMetrics(
  params: ProcessMetricsParams
): Promise<ProcessMetricsSummary> {
  if (isMockEnabled) {
    return Promise.resolve(buildProcessMetrics(params));
  }

  const response = await http.request<ApiResponse<ProcessMetricsSummary>>(
    "get",
    PROCESS_METRICS_URL,
    { params }
  );
  console.log(1, response);
  return unwrapResponse(response, "获取工序指标失败");
}

export async function fetchParetoData(
  params: ParetoChartParams
): Promise<ParetoChartData> {
  if (isMockEnabled) {
    return Promise.resolve(buildParetoData(params));
  }

  const response = await http.request<ApiResponse<ParetoChartData>>(
    "get",
    PROCESS_PARETO_URL,
    { params }
  );

  return unwrapResponse(response, "获取柏拉图数据失败");
}

export async function fetchProcessStageInfo(
  params: ProcessStageInfoParams
): Promise<ProcessStageInfo[]> {
  if (isMockEnabled) {
    return Promise.resolve([]);
  }

  const requestParams =
    params.origin === undefined || params.origin === null
      ? { processCode: params.processCode }
      : params;

  const response = await http.request<ApiResponse<ProcessStageInfo[]>>(
    "get",
    PROCESS_STAGE_INFO_URL,
    { params: requestParams }
  );

  return unwrapResponse(response, "获取工序信息失败");
}

export type {
  DashboardSummaryParams,
  ProcessDetailParams,
  DashboardProductsParams,
  DashboardProductOption,
  ProcessMetricsParams,
  ProcessMetricsSummary,
  ProcessStageInfo,
  ParetoChartParams,
  ParetoChartData
};
