import { http } from "@/utils/http";
import { fetchDashboardProducts } from "@/api/dashboard";
import { getProcessSteps } from "@/api/processFlow";
import type { ParameterConfig, ParameterOptions } from "types/parameter";

type ParameterMockModule = typeof import("@/mocks/parameter");

const shouldUseParameterMock =
  String(import.meta.env.VITE_USE_PARAMETER_MOCK ?? "").toLowerCase() ===
  "true";

let parameterMockModulePromise: Promise<ParameterMockModule> | undefined;

const loadParameterMockModule = async () => {
  if (!parameterMockModulePromise) {
    parameterMockModulePromise = import("@/mocks/parameter");
  }
  return parameterMockModulePromise;
};

interface ParameterApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

type ParameterApiResult<T> = T | ParameterApiResponse<T>;

function isWrappedResponse<T>(
  value: ParameterApiResult<T>
): value is ParameterApiResponse<T> {
  return typeof value === "object" && value !== null && "success" in value;
}

function unwrapParameterResponse<T>(
  response: ParameterApiResult<T>,
  defaultMessage: string,
  requireData = true
): T {
  if (isWrappedResponse(response)) {
    if (!response.success) {
      throw new Error(response.message ?? defaultMessage);
    }

    if (requireData && response.data === undefined) {
      throw new Error(defaultMessage);
    }

    return (response.data ?? undefined) as T;
  }

  return response as T;
}

export async function getParameterConfigs() {
  if (shouldUseParameterMock) {
    const { listParameterMockConfigs } = await loadParameterMockModule();
    return listParameterMockConfigs();
  }

  const response = await http.request<ParameterApiResult<ParameterConfig[]>>(
    "get",
    "/parameter/configs"
  );

  return unwrapParameterResponse(response, "获取参数配置失败");
}

export async function getParameterConfigDetail(id: string) {
  if (shouldUseParameterMock) {
    const { getParameterMockConfig } = await loadParameterMockModule();
    const detail = getParameterMockConfig(id);
    if (!detail) {
      throw new Error("获取参数配置详情失败");
    }
    return detail;
  }

  const response = await http.request<ParameterApiResult<ParameterConfig>>(
    "get",
    `/parameter/configs/${id}`
  );

  return unwrapParameterResponse(response, "获取参数配置详情失败");
}

export async function createParameterConfig(data: ParameterConfig) {
  if (shouldUseParameterMock) {
    const { addParameterMockConfig } = await loadParameterMockModule();
    const result = addParameterMockConfig(data);
    if (!result.success) {
      throw new Error(result.message ?? "创建参数配置失败");
    }
    return;
  }

  const response = await http.request<ParameterApiResult<void>>(
    "post",
    "/parameter/configs",
    { data }
  );

  return unwrapParameterResponse(response, "创建参数配置失败", false);
}

export async function updateParameterConfig(id: string, data: ParameterConfig) {
  if (shouldUseParameterMock) {
    const { updateParameterMockConfig } = await loadParameterMockModule();
    const result = updateParameterMockConfig(id, data);
    if (!result.success) {
      throw new Error(result.message ?? "更新参数配置失败");
    }
    return;
  }

  const response = await http.request<ParameterApiResult<void>>(
    "put",
    `/parameter/configs/${id}`,
    { data }
  );

  return unwrapParameterResponse(response, "更新参数配置失败", false);
}

export async function getParameterOptions() {
  if (shouldUseParameterMock) {
    const { getParameterMockOptions } = await loadParameterMockModule();
    return getParameterMockOptions();
  }

  const [productOptions, processSteps] = await Promise.all([
    fetchDashboardProducts({}),
    getProcessSteps()
  ]);

  const products: ParameterOptions["products"] = productOptions.map(item => ({
    label: item.label,
    value: item.code
  }));

  const processes: ParameterOptions["processes"] = processSteps
    .map(item => {
      const stepTypeNo = item.step_type_no?.trim();

      if (!stepTypeNo) {
        return null;
      }

      return {
        label: item.stage_name ?? item.stage_code,
        value: stepTypeNo
      };
    })
    .filter(
      (item): item is ParameterOptions["processes"][number] => item !== null
    );

  return {
    products,
    processes
  } satisfies ParameterOptions;
}
