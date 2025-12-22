import { http } from "@/utils/http";
import type { ParamsDetail } from "@/api/params";
import type { ParameterTypeEnum } from "../types";

interface ApiResponse<T> {
  code?: number;
  data?: T;
  message?: string;
}

export interface CreateParameterBasePayload {
  name: string;
  type: ParameterTypeEnum;
  flowNo?: string | number | null;
  orderId?: string | number | null;
  stepTypeNo?: string | number | null;
}

export interface CreateParameterDetailPayload {
  baseId: number | string;
  description: string;
  params: string;
}

interface CreateParameterBaseResponse {
  baseId?: number | string;
  id?: number | string;
}

export enum ParameterApiErrorMessage {
  MissingBackend = "未配置 Java 后端地址",
  BaseCreate = "创建参数集基础信息失败",
  BaseIdMissing = "参数集基础ID缺失",
  DetailCreate = "创建参数集详情失败"
}

const isApiResponse = <T>(response: unknown): response is ApiResponse<T> =>
  typeof response === "object" && response !== null;

const unwrapResponse = <T>(
  response: unknown,
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

const getJavaBackendUrl = (): string => {
  const baseUrl = import.meta.env.VITE_JAVA_BACKEND_URL;
  if (!baseUrl) throw new Error(ParameterApiErrorMessage.MissingBackend);
  return baseUrl;
};

export const createParameterBase = async (
  payload: CreateParameterBasePayload
): Promise<number | string> => {
  const baseUrl = getJavaBackendUrl();
  const response = await http.request(
    "post",
    `${baseUrl}/api/mes/v1/params/base`,
    {
      data: payload
    }
  );
  const data = unwrapResponse<CreateParameterBaseResponse>(
    response,
    ParameterApiErrorMessage.BaseCreate
  );

  return Number(data);
};

export const createParameterDetail = async (
  payload: CreateParameterDetailPayload
): Promise<ParamsDetail> => {
  const baseUrl = getJavaBackendUrl();
  const response = await http.request(
    "post",
    `${baseUrl}/api/mes/v1/params/detail`,
    {
      data: payload
    }
  );
  return unwrapResponse<ParamsDetail>(
    response,
    ParameterApiErrorMessage.DetailCreate
  );
};
