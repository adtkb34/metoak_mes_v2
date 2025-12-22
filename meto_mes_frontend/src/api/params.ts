import { http } from "@/utils/http";

export type ParamsContentValue =
  | string
  | number
  | boolean
  | null
  | ParamsContent
  | ParamsContentValue[];

export interface ParamsContent {
  [key: string]: ParamsContentValue;
}

export interface ParamsDetail {
  id?: number;
  name?: string;
  description?: string;
  versionMajor?: number;
  versionMinor?: number;
  versionPatch?: number;
  version?: string;
  type?: number;
  relationId?: string | number | null;
  relationName?: string;
  username?: string;
  createTime?: string;
  createdAt?: string;
  updateTime?: string;
  params?: ParamsContent | string | null;
}

export interface ParamsPresetPayload {
  name: string;
  description: string;
  params: string;
  username: string;
}

export interface ParamsBaseQuery {
  type: number;
  relationId?: string | number | null;
}

export interface ParamsBaseItem {
  id?: number;
  name?: string;
}

export interface ParamsVersionQuery {
  type: number;
  relationId?: string | number | null;
  paramsId?: string | number | null;
}

export interface ParamsVersionItem {
  id?: number;
  name?: string;
  version?: string;
  versionMajor?: number;
  versionMinor?: number;
  versionPatch?: number;
  description?: string;
  username?: string;
  createTime?: string;
  createdAt?: string;
}

function unwrapParamsResponse<T>(response: any, errorMessage: string): T {
  if (
    response?.code !== undefined &&
    response.code !== 0 &&
    response.code !== 200
  ) {
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
  const response = await http.request(
    "get",
    `${baseUrl}/api/mes/v1/params/detail/${id}`
  );
  return unwrapParamsResponse<ParamsDetail>(response, "获取参数集详情失败");
}

export async function getParamsDetailList(): Promise<ParamsDetail[]> {
  const baseUrl = import.meta.env.VITE_JAVA_BACKEND_URL;
  if (!baseUrl) throw new Error("未配置 Java 后端地址");
  const response = await http.request(
    "get",
    `${baseUrl}/api/mes/v1/params/detail`
  );
  return unwrapParamsResponse<ParamsDetail[]>(response, "获取参数集列表失败");
}

export async function createParamsPreset(
  payload: ParamsPresetPayload
): Promise<ParamsDetail> {
  const baseUrl = import.meta.env.VITE_JAVA_BACKEND_URL;
  if (!baseUrl) throw new Error("未配置 Java 后端地址");
  const response = await http.request("post", `${baseUrl}/api/mes/v1/params`, {
    data: payload
  });
  return unwrapParamsResponse<ParamsDetail>(response, "新增参数集失败");
}

export async function updateParamsPreset(
  id: number | string,
  payload: ParamsPresetPayload
): Promise<ParamsDetail> {
  const baseUrl = import.meta.env.VITE_JAVA_BACKEND_URL;
  if (!baseUrl) throw new Error("未配置 Java 后端地址");
  const response = await http.request(
    "put",
    `${baseUrl}/api/mes/v1/params/${id}`,
    {
      data: payload
    }
  );
  return unwrapParamsResponse<ParamsDetail>(response, "更新参数集失败");
}

export async function getParamsBaseList(
  query: ParamsBaseQuery
): Promise<ParamsBaseItem[]> {
  const baseUrl = import.meta.env.VITE_JAVA_BACKEND_URL;
  if (!baseUrl) throw new Error("未配置 Java 后端地址");
  const response = await http.request(
    "get",
    `${baseUrl}/api/mes/v1/params/base`,
    {
      params: query
    }
  );
  return unwrapParamsResponse<ParamsBaseItem[]>(
    response,
    "获取参数基础数据失败"
  );
}

export async function getParamsNameList(
  query: ParamsBaseQuery
): Promise<ParamsBaseItem[]> {
  const baseUrl = import.meta.env.VITE_JAVA_BACKEND_URL;
  if (!baseUrl) throw new Error("未配置 Java 后端地址");
  const response = await http.request(
    "get",
    `${baseUrl}/api/mes/v1/params/name`,
    {
      params: query
    }
  );
  return unwrapParamsResponse<ParamsBaseItem[]>(response, "获取参数名称失败");
}

export async function getParamsVersionList(
  query: ParamsVersionQuery
): Promise<ParamsVersionItem[]> {
  const baseUrl = import.meta.env.VITE_JAVA_BACKEND_URL;
  if (!baseUrl) throw new Error("未配置 Java 后端地址");
  const response = await http.request(
    "get",
    `${baseUrl}/api/mes/v1/params/version`,
    {
      params: query
    }
  );
  return unwrapParamsResponse<ParamsVersionItem[]>(
    response,
    "获取参数版本失败"
  );
}
