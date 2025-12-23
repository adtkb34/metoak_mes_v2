import { http } from "@/utils/http";

export enum ParamsApiPath {
  Base = "/api/mes/v1/params/base",
  Detail = "/api/mes/v1/params/detail",
  Name = "/api/mes/v1/params/name",
  Root = "/api/mes/v1/params",
  Version = "/api/mes/v1/params/version"
}

export enum ParamsApiErrorMessage {
  MissingBackend = "未配置 Java 后端地址",
  DetailFetch = "获取参数集详情失败",
  DetailListFetch = "获取参数集列表失败",
  CreateFailed = "新增参数集失败",
  UpdateFailed = "更新参数集失败",
  BaseFetchFailed = "获取参数基础数据失败",
  NameFetchFailed = "获取参数名称失败",
  VersionFetchFailed = "获取参数版本失败"
}

interface ApiResponse<T> {
  code?: number;
  data?: T;
  message?: string;
}

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
  baseId?: number | string | null;
  name?: string;
  description?: string;
  versionMajor?: number;
  versionMinor?: number;
  versionPatch?: number;
  version?: string;
  type?: number;
  paramsId?: string | number | null;
  relationId?: string | number | null;
  relationName?: string;
  flowNo?: string | number | null;
  orderId?: string | number | null;
  stepTypeNo?: string | number | null;
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

const isApiResponse = <T>(
  response: ApiResponse<T> | T
): response is ApiResponse<T> =>
  typeof response === "object" && response !== null && "code" in response;

const unwrapParamsResponse = <T>(
  response: ApiResponse<T> | T,
  errorMessage: ParamsApiErrorMessage
): T => {
  if (isApiResponse<T>(response)) {
    if (
      response.code !== undefined &&
      response.code !== 0 &&
      response.code !== 200
    ) {
      throw new Error(response.message ?? errorMessage);
    }
    if (response.data !== undefined) {
      return response.data as T;
    }
  }
  return response as T;
};

const getJavaBackendUrl = (): string => {
  const baseUrl = import.meta.env.VITE_JAVA_BACKEND_URL;
  if (!baseUrl) throw new Error(ParamsApiErrorMessage.MissingBackend);
  return baseUrl;
};

const normalizeParamsDetail = (
  detail: ParamsDetail | null,
  id: number
): ParamsDetail => ({
  ...(detail ?? {}),
  id
});

export async function getParamsDetail(id: number): Promise<ParamsDetail> {
  const baseUrl = getJavaBackendUrl();
  const response = await http.request<ApiResponse<ParamsDetail> | ParamsDetail>(
    "get",
    `${baseUrl}${ParamsApiPath.Detail}/${id}`
  );
  const data = unwrapParamsResponse<ParamsDetail>(
    response,
    ParamsApiErrorMessage.DetailFetch
  );
  return normalizeParamsDetail(data ?? null, id);
}

export async function getParamsDetailList(): Promise<ParamsDetail[]> {
  const baseUrl = getJavaBackendUrl();
  const response = await http.request<
    ApiResponse<ParamsDetail[]> | ParamsDetail[]
  >("get", `${baseUrl}${ParamsApiPath.Detail}`);
  return unwrapParamsResponse<ParamsDetail[]>(
    response,
    ParamsApiErrorMessage.DetailListFetch
  );
}

export async function createParamsPreset(
  payload: ParamsPresetPayload
): Promise<ParamsDetail> {
  const baseUrl = getJavaBackendUrl();
  const response = await http.request<ApiResponse<ParamsDetail> | ParamsDetail>(
    "post",
    `${baseUrl}${ParamsApiPath.Root}`,
    {
      data: payload
    }
  );
  return unwrapParamsResponse<ParamsDetail>(
    response,
    ParamsApiErrorMessage.CreateFailed
  );
}

export async function updateParamsPreset(
  id: number | string,
  payload: ParamsPresetPayload
): Promise<ParamsDetail> {
  const baseUrl = getJavaBackendUrl();
  const response = await http.request<ApiResponse<ParamsDetail> | ParamsDetail>(
    "post",
    `${baseUrl}${ParamsApiPath.Detail}`,
    {
      data: payload
    }
  );
  console.log(payload)
  return unwrapParamsResponse<ParamsDetail>(
    response,
    ParamsApiErrorMessage.UpdateFailed
  );
}

export async function getParamsBaseList(
  query: ParamsBaseQuery
): Promise<ParamsBaseItem[]> {
  const baseUrl = getJavaBackendUrl();
  const response = await http.request<
    ApiResponse<ParamsBaseItem[]> | ParamsBaseItem[]
  >("get", `${baseUrl}${ParamsApiPath.Base}`, {
    params: query
  });
  return unwrapParamsResponse<ParamsBaseItem[]>(
    response,
    ParamsApiErrorMessage.BaseFetchFailed
  );
}

export async function getParamsNameList(
  query: ParamsBaseQuery
): Promise<ParamsBaseItem[]> {
  const baseUrl = getJavaBackendUrl();
  const response = await http.request<
    ApiResponse<ParamsBaseItem[]> | ParamsBaseItem[]
  >("get", `${baseUrl}${ParamsApiPath.Name}`, {
    params: query
  });
  return unwrapParamsResponse<ParamsBaseItem[]>(
    response,
    ParamsApiErrorMessage.NameFetchFailed
  );
}

export async function getParamsVersionList(
  query: ParamsVersionQuery
): Promise<ParamsVersionItem[]> {
  const baseUrl = getJavaBackendUrl();
  const response = await http.request<
    ApiResponse<ParamsVersionItem[]> | ParamsVersionItem[]
  >("get", `${baseUrl}${ParamsApiPath.Version}`, {
    params: query
  });
  return unwrapParamsResponse<ParamsVersionItem[]>(
    response,
    ParamsApiErrorMessage.VersionFetchFailed
  );
}
