import { http } from "@/utils/http";

export interface ParamsDetail {
  id?: number;
  name?: string;
  description?: string;
  versionMajor?: number;
  versionMinor?: number;
  versionPatch?: number;
  params?: Record<string, any>;
}

export interface ParamsPresetPayload {
  name: string;
  description: string;
  params: string;
  created_by: string;
}

function unwrapParamsResponse<T>(response: any, errorMessage: string): T {
  if (response?.code !== undefined && response.code !== 0 && response.code !== 200) {
    throw new Error(response?.message ?? errorMessage);
  }
  if (response?.data !== undefined) {
    return response.data as T;
  }
  return response as T;
}

export async function getParamsDetail(id: number): Promise<ParamsDetail> {
  const baseUrl = import.meta.env.VITE_JAVA_BACKEND_URL;
  if (!baseUrl) throw new Error("未配置 Java 后端地址");
  const response = await http.request("get", `${baseUrl}/api/mes/v1/params/detail/${id}`);
  return unwrapParamsResponse<ParamsDetail>(response, "获取参数集详情失败");
}

export async function getParamsDetailList(): Promise<ParamsDetail[]> {
  const baseUrl = import.meta.env.VITE_JAVA_BACKEND_URL;
  if (!baseUrl) throw new Error("未配置 Java 后端地址");
  const response = await http.request("get", `${baseUrl}/api/mes/v1/params/detail`);
  return unwrapParamsResponse<ParamsDetail[]>(response, "获取参数集列表失败");
}

export async function createParamsPreset(payload: ParamsPresetPayload): Promise<ParamsDetail> {
  const baseUrl = import.meta.env.VITE_JAVA_BACKEND_URL;
  if (!baseUrl) throw new Error("未配置 Java 后端地址");
  const response = await http.request("post", `${baseUrl}/api/mes/v1/params`, { data: payload });
  return unwrapParamsResponse<ParamsDetail>(response, "新增参数集失败");
}
