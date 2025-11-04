import { http } from "@/utils/http";
import { fetchDashboardProducts } from "@/api/dashboard";
import { getProcessFlow } from "@/api/processFlow";
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
  const [productOptions, processOptions] = await Promise.all([
    fetchDashboardProducts({}),
    getProcessFlow()
  ]);

  const products: ParameterOptions["products"] = productOptions.map(item => ({
    label: item.label,
    value: item.code
  }));

  const processMap = new Map<string, string>();
  processOptions.forEach(item => {
    if (!item.process_code) return;
    if (processMap.has(item.process_code)) return;
    processMap.set(
      item.process_code,
      item.process_name ?? item.process_code
    );
  });

  const processes: ParameterOptions["processes"] = Array.from(processMap).map(
    ([value, label]) => ({ label, value })
  );

  return {
    products,
    processes
  } satisfies ParameterOptions;
}
