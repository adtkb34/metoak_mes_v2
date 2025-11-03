import { http } from "@/utils/http";
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

export function getParameterOptions() {
  return http.request<ParameterOptions>("get", "/parameter/options");
}
