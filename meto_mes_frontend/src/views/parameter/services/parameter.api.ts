import { http } from "@/utils/http";
import type { ParamsDetail } from "@/api/params";
import type {
  ParameterListItem,
  ParameterListQuery,
  ParameterTypeEnum
} from "../types";

interface ApiResponse<T> {
  code?: number;
  data?: T;
  message?: string;
}

export interface CreateParameterBasePayload {
  name: string;
  type: ParameterTypeEnum;
  createdBy: string;
  flowNo?: string | number | null;
  orderId?: string | number | null;
  stepTypeNo?: string | number | null;
}

export interface CreateParameterDetailPayload {
  baseId: number | string;
  description: string;
  params: string;
  createdBy: string;
}

interface CreateParameterBaseResponse {
  baseId?: number | string;
  id?: number | string;
}

export enum ParameterApiPath {
  Base = "/api/mes/v1/params/base",
  Detail = "/api/mes/v1/params/detail",
  Root = "/api/mes/v1/params",
  Name = "/api/mes/v1/params/name",
  Version = "/api/mes/v1/params/version"
}

export enum ParameterApiErrorMessage {
  MissingBackend = "未配置 Java 后端地址",
  BaseCreate = "创建参数集基础信息失败",
  BaseIdMissing = "参数集基础ID缺失",
  DetailCreate = "创建参数集详情失败",
  DetailFetch = "获取参数内容失败",
  ListFetch = "获取参数清单失败"
}

export interface ParameterDetailContent {
  id?: number | string;
  baseId?: number | string | null;
  paramsId?: string | number | null;
  detailId?: number | string | null;
  name?: string;
  description?: string;
  type?: ParameterTypeEnum;
  relationId?: string | number | null;
  relationName?: string;
  flowNo?: string | number | null;
  orderId?: string | number | null;
  stepTypeNo?: string | number | null;
  createdBy?: string;
  createdAt?: string;
  version?: string;
  versionLabel?: string;
  params?: ParamsDetail["params"];
}

const isApiResponse = <T>(
  response: ApiResponse<T> | T
): response is ApiResponse<T> =>
  typeof response === "object" && response !== null && "code" in response;

const unwrapResponse = <T>(
  response: ApiResponse<T> | T,
  errorMessage: ParameterApiErrorMessage
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

const extractBaseId = (
  response: CreateParameterBaseResponse | number | string
): number | string => {
  if (typeof response === "number" || typeof response === "string") {
    return response;
  }
  if (response.baseId !== undefined && response.baseId !== null) {
    return response.baseId;
  }
  if (response.id !== undefined && response.id !== null) {
    return response.id;
  }
  throw new Error(ParameterApiErrorMessage.BaseIdMissing);
};

const getJavaBackendUrl = (): string => {
  const baseUrl = import.meta.env.VITE_JAVA_BACKEND_URL;
  if (!baseUrl) throw new Error(ParameterApiErrorMessage.MissingBackend);
  return baseUrl;
};

export const createParameterBase = async (
  payload: CreateParameterBasePayload
): Promise<number | string> => {
  const baseUrl = getJavaBackendUrl();
  const response:
    | ApiResponse<CreateParameterBaseResponse>
    | CreateParameterBaseResponse = await http.request(
    "post",
    `${baseUrl}${ParameterApiPath.Base}`,
    {
      data: payload
    }
  );
  const data = unwrapResponse<CreateParameterBaseResponse>(
    response,
    ParameterApiErrorMessage.BaseCreate
  );

  return extractBaseId(data);
};

export const createParameterDetail = async (
  payload: CreateParameterDetailPayload
): Promise<ParamsDetail> => {
  const baseUrl = getJavaBackendUrl();
  const response: ApiResponse<ParamsDetail> | ParamsDetail = await http.request(
    "post",
    `${baseUrl}${ParameterApiPath.Detail}`,
    {
      data: payload
    }
  );
  return unwrapResponse<ParamsDetail>(
    response,
    ParameterApiErrorMessage.DetailCreate
  );
};

const buildListQueryParams = (
  query: ParameterListQuery
): ParameterListQuery => {
  const params: ParameterListQuery = {
    type: query.type
  };
  if (query.flowNo !== null && query.flowNo !== undefined) {
    params.flowNo = query.flowNo;
  }
  if (query.orderId !== null && query.orderId !== undefined) {
    params.orderId = query.orderId;
  }
  if (query.stepTypeNo !== null && query.stepTypeNo !== undefined) {
    params.stepTypeNo = query.stepTypeNo;
  }
  return params;
};

export const getParameterList = async (
  query: ParameterListQuery
): Promise<ParameterListItem[]> => {
  const baseUrl = getJavaBackendUrl();
  const params = buildListQueryParams(query);
  const response: ApiResponse<ParameterListItem[]> | ParameterListItem[] =
    await http.request("get", `${baseUrl}${ParameterApiPath.Root}`, {
      params
    });
  const list = unwrapResponse<ParameterListItem[]>(
    response,
    ParameterApiErrorMessage.ListFetch
  );
  return list;
};

export const getParameterDetailContent = async (
  detailId: number | string
): Promise<ParameterDetailContent> => {
  const baseUrl = getJavaBackendUrl();
  const response: ApiResponse<ParameterDetailContent> | ParameterDetailContent =
    await http.request(
      "get",
      `${baseUrl}${ParameterApiPath.Detail}/${detailId}`
    );
  return unwrapResponse<ParameterDetailContent>(
    response,
    ParameterApiErrorMessage.DetailFetch
  );
};
