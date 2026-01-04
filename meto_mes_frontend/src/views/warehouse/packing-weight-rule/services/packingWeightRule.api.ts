import { http } from "@/utils/http";
import {
  PACKING_WEIGHT_RULE_API_BASE,
  PACKING_WEIGHT_RULE_MESSAGE
} from "../packingWeightRule.constants";
import type { PackingWeightRule, PackingWeightRuleFormState } from "../types";

type ApiResponse<T> = {
  code?: number;
  data?: T;
  message?: string;
};

const isApiResponse = <T>(value: ApiResponse<T> | T): value is ApiResponse<T> =>
  typeof value === "object" && value !== null && "code" in value;

const unwrapResponse = <T>(
  response: ApiResponse<T> | T,
  errorMessage: string
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

const getBackendBaseUrl = (): string =>
  import.meta.env.VITE_JAVA_BACKEND_URL ?? "";

export const fetchPackingWeightRules = async (): Promise<
  PackingWeightRule[]
> => {
  const url = `${getBackendBaseUrl()}${PACKING_WEIGHT_RULE_API_BASE}`;
  const response: ApiResponse<PackingWeightRule[]> | PackingWeightRule[] =
    await http.request("get", url);
  return unwrapResponse<PackingWeightRule[]>(
    response,
    PACKING_WEIGHT_RULE_MESSAGE.loadFailed
  );
};

export const createPackingWeightRule = async (
  payload: PackingWeightRuleFormState
): Promise<number> => {
  const url = `${getBackendBaseUrl()}${PACKING_WEIGHT_RULE_API_BASE}`;
  const response: ApiResponse<number> | number = await http.request(
    "post",
    url,
    {
      data: payload
    }
  );
  return unwrapResponse<number>(
    response,
    PACKING_WEIGHT_RULE_MESSAGE.createFailed
  );
};

export const updatePackingWeightRule = async (
  id: number,
  payload: PackingWeightRuleFormState
): Promise<boolean> => {
  const url = `${getBackendBaseUrl()}${PACKING_WEIGHT_RULE_API_BASE}/${id}`;
  const response: ApiResponse<boolean> | boolean = await http.request(
    "put",
    url,
    {
      data: payload
    }
  );
  return unwrapResponse<boolean>(
    response,
    PACKING_WEIGHT_RULE_MESSAGE.updateFailed
  );
};
