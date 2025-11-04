import { http } from "@/utils/http";
import { fetchDashboardProducts } from "@/api/dashboard";
import { getProcessSteps } from "@/api/processFlow";
import type { ParameterConfig, ParameterOptions } from "types/parameter";

export function getParameterConfigs() {
  return http.request<ParameterConfig[]>("get", "/parameter/configs");
}

export function getParameterConfigDetail(id: string) {
  return http.request<ParameterConfig>("get", `/parameter/configs/${id}`);
}

export function createParameterConfig(data: ParameterConfig) {
  return http.request("post", "/parameter/configs", { data });
}

export function updateParameterConfig(id: string, data: ParameterConfig) {
  return http.request("put", `/parameter/configs/${id}`, { data });
}

export async function getParameterOptions() {
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
