import { http } from "@/utils/http";

export interface BackendVersionInfo {
  backendVersion: string;
}

export function getBackendVersion() {
  return http.request<BackendVersionInfo>("get", "/version");
}
