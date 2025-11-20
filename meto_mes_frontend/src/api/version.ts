import { http } from "@/utils/http";

export interface BackendVersionInfo {
  backendVersion: string;
}

export function getBackendVersion() {
  return http.request<BackendVersionInfo>("get", "/version");
}

interface JavaBackendVersionInfo {
  version?: string;
  data?: { version?: string };
}

function extractJavaBackendVersion(
  response: JavaBackendVersionInfo | string
): string {
  if (typeof response === "string") {
    return response;
  }

  if (response?.version) {
    return response.version;
  }

  if (response?.data?.version) {
    return response.data.version;
  }

  throw new Error("无法获取 Java 后端版本信息");
}

export async function getJavaBackendVersion() {
  const spcUrl = import.meta.env.VITE_SPC_URL;
  if (!spcUrl) {
    throw new Error("未配置 SPC 服务地址");
  }

  const response = await http.request<JavaBackendVersionInfo | string>(
    "get",
    `${spcUrl}/api/mes/v1/version`
  );

  return extractJavaBackendVersion(response);
}
