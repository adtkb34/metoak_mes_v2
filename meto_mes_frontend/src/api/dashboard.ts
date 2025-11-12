import { http } from "@/utils/http";
import qs from "qs";
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
  ParetoChartData,
  MaterialCodeParams
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
const STEP_TYPE_PROCESS_METRICS_URL = "/dashboard/step-type-process-metrics";
const PROCESS_STAGE_INFO_URL = "/dashboard/process-stage-info";
const PROCESS_PARETO_URL = "/dashboard/pareto";
const MATERIAL_CODES_URL = "/dashboard/material-codes";

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
  response.data = [
    { label: "10cm镜头模组（cyc） (800.00012)", code: "800.00012" },
    { label: "6cm镜头模组__S315割草机模组 (800.00051)", code: "800.00051" },
    { label: "AD-Car域控Box (1000.00088)", code: "1000.00088" },
    {
      label:
        "FV-C01-V01 商用车_M55H竖版单目一体机_镜头模组半成品_01_V1.0 (800.00061)",
      code: "800.00061"
    },
    { label: "FV-C21_E02_B10_01_V1.1 (800.00049)", code: "800.00049" },
    { label: "FV-C21_E03_01_V1.1 (800.00050)", code: "800.00050" },
    { label: "FV-C21_主机_01 (900.00091)", code: "900.00091" },
    { label: "FV-C21_主机_02 (900.00092)", code: "900.00092" },
    { label: "FV-P02V05C0001 (900.00053)", code: "900.00053" },
    { label: "FV-P02V05C0002 (900.00054)", code: "900.00054" },
    { label: "I型10cm镜头模组V2 (800.00006)", code: "800.00006" },
    { label: "M55单目一体机 (900.00117)", code: "900.00117" },
    { label: "M55单目一体机_02 (900.00134)", code: "900.00134" },
    { label: "MET0-Car-高精导航套件 (1000.00083)", code: "1000.00083" },
    { label: "S1_S01主机 (900.01099)", code: "900.01099" },
    { label: "S330S_模组_C1 (800.01044)", code: "800.01044" },
    { label: "Simor4621 (EC-IC.00297)", code: "EC-IC.00297" },
    { label: "SZ-BSD_S50 (S-1000.01026)", code: "S-1000.01026" },
    { label: "U60-61_模组_C1 (800.01040)", code: "800.01040" },
    { label: "乘用车_M55H横版单目一体机 (900.00119)", code: "900.00119" },
    { label: "公交客运车辆碰撞缓解系统 (1000.00085)", code: "1000.00085" },
    { label: "单目模组 (800.00048)", code: "800.00048" },
    { label: "单目模组 (800.00054)", code: "800.00054" },
    { label: "单目模组 (800.00055)", code: "800.00055" },
    { label: "单目模组 (800.00056)", code: "800.00056" },
    { label: "双目低速自动驾驶景区小车 (900.00118)", code: "900.00118" },
    { label: "双目模组 (800.00060)", code: "800.00060" },
    { label: "双目模组 (800.00062)", code: "800.00062" },
    { label: "双目模组 (800.00063)", code: "800.00063" },
    { label: "双目立体相机 S315F-SK (900.00083)", code: "900.00083" },
    { label: "双目立体相机S3 (1000.00021)", code: "1000.00021" },
    { label: "双目立体相机S3 (1000.00023)", code: "1000.00023" },
    { label: "双目立体相机S3 (1000.00065)", code: "1000.00065" },
    { label: "双目立体相机S3 (900.00017)", code: "900.00017" },
    { label: "双目立体相机S3 (900.00018)", code: "900.00018" },
    { label: "双目立体相机S3 (900.00061)", code: "900.00061" },
    { label: "双目立体相机S3 (900.00071)", code: "900.00071" },
    { label: "双目立体相机S3 (900.00104)", code: "900.00104" },
    { label: "双目立体相机S315 (900.00101)", code: "900.00101" },
    { label: "双目立体相机S315 (900.00121)", code: "900.00121" },
    { label: "双目立体相机S315-X5 (900.00111)", code: "900.00111" },
    { label: "双目立体相机S316 (900.00120)", code: "900.00120" },
    { label: "双目立体相机S316L (900.00126)", code: "900.00126" },
    { label: "双目立体相机S316L (900.00140)", code: "900.00140" },
    {
      label: "双目视觉限高碰撞预警,带车道偏离 (1000.01023)",
      code: "1000.01023"
    },
    { label: "双目视觉限高预警系统 (1000.01024)", code: "1000.01024" },
    { label: "商用车_M55H竖版单目一体机 (900.00139)", code: "900.00139" },
    { label: "域控Box (1000.00045)", code: "1000.00045" },
    {
      label: "定制版景区自动驾驶低速车智能套件 (1000.00041)",
      code: "1000.00041"
    },
    { label: "工装板 (900.00089)", code: "900.00089" },
    { label: "智能低速车-A结构套件 (900.00106)", code: "900.00106" },
    { label: "汽车电子控制系统 (1000.00017)", code: "1000.00017" },
    { label: "汽车电子控制系统 (1000.00027)", code: "1000.00027" },
    { label: "汽车电子控制系统 (1000.00042)", code: "1000.00042" },
    { label: "汽车电子控制系统 (1000.00043)", code: "1000.00043" },
    { label: "汽车电子控制系统 (1000.00054)", code: "1000.00054" },
    { label: "汽车电子控制系统 (1000.00055)", code: "1000.00055" },
    { label: "汽车电子控制系统 (1000.00058)", code: "1000.00058" },
    { label: "汽车电子控制系统 (1000.00070)", code: "1000.00070" },
    { label: "汽车电子控制系统 (1000.00077)", code: "1000.00077" },
    { label: "汽车电子控制系统 (1000.00084)", code: "1000.00084" },
    { label: "汽车电子控制系统 (1000.01042)", code: "1000.01042" },
    { label: "汽车电子控制系统 (1000.01044)", code: "1000.01044" },
    { label: "汽车电子控制系统 (900.00041)", code: "900.00041" },
    { label: "汽车电子控制系统 (900.00049)", code: "900.00049" },
    { label: "相机感知套件 (1000.00082)", code: "1000.00082" },
    { label: "线控低速小车-B (900.00107)", code: "900.00107" },
    { label: "线控套件 (1000.00080)", code: "1000.00080" },
    { label: "线控电车-A (1000.00059)", code: "1000.00059" },
    { label: "自动紧急制动系统 (1000.00078)", code: "1000.00078" },
    { label: "车载双目立体视觉相机 (900.00105)", code: "900.00105" },
    { label: "车载双目立体视觉相机 (900.00124)", code: "900.00124" },
    { label: "车载双目立体视觉相机总成 (1000.00062)", code: "1000.00062" },
    { label: "车载双目立体视觉相机支架总成 (300.00353)", code: "300.00353" },
    { label: "镜头-消费 (201.00035)", code: "201.00035" },
    { label: "镜头OV192214 (201.00034)", code: "201.00034" }
  ];
  return unwrapResponse(response, "获取产品选项失败");
}

export async function fetchMaterialCodes(
  params: MaterialCodeParams
): Promise<string[]> {
  if (isMockEnabled) {
    return Promise.resolve([]);
  }

  const response = await http.request<
    ApiResponse<{ count: number; data: Array<string | null | undefined> }>
  >("get", MATERIAL_CODES_URL, {
    params
  });
  // console.log(`response: ${response.data}`);
  // const payload = unwrapResponse(response, "获取产品编码失败");
  // const codes = response.data;

  // const normalized = codes
  //   .map(code =>
  //     typeof code === "string" ? code.trim() : code ? String(code).trim() : ""
  //   )
  //   .filter(code => code.length > 0);

  return response.data;
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
    {
      params,
      paramsSerializer: params => {
        return qs.stringify(params, {
          arrayFormat: "repeat", // 使用重复参数名格式
          indices: false // 不显示索引
        });
      }
    }
  );
  return unwrapResponse(response, "获取工序指标失败");
}

export async function fetchStepTypeProcessMetrics(
  params: ProcessMetricsParams
): Promise<ProcessMetricsSummary> {
  if (isMockEnabled) {
    return Promise.resolve(buildProcessMetrics(params));
  }
  const response = await http.request<ApiResponse<ProcessMetricsSummary>>(
    "get",
    STEP_TYPE_PROCESS_METRICS_URL,
    {
      params,
      paramsSerializer: params => {
        return qs.stringify(params, {
          arrayFormat: "repeat", // 使用重复参数名格式
          indices: false // 不显示索引
        });
      }
    }
  );
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
    {
      params,
      paramsSerializer: params => {
        return qs.stringify(params, {
          arrayFormat: "repeat", // 使用重复参数名格式
          indices: false // 不显示索引
        });
      }
    }
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
  ParetoChartData,
  MaterialCodeParams
};
