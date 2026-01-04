import { http } from "@/utils/http";
import {
  PACKING_WEIGHT_RULE_MATERIAL_API,
  PACKING_WEIGHT_RULE_MESSAGE
} from "../packingWeightRule.constants";
import type { WorkOrderMaterial } from "../types";
import {
  type ApiResponse,
  getBackendBaseUrl,
  unwrapResponse
} from "./packingWeightRuleApi.helper";

export const fetchWorkOrderMaterials = async (): Promise<
  WorkOrderMaterial[]
> => {
  const url = `${getBackendBaseUrl()}${PACKING_WEIGHT_RULE_MATERIAL_API}`;
  const response: ApiResponse<WorkOrderMaterial[]> | WorkOrderMaterial[] =
    await http.request("get", url);

  return unwrapResponse<WorkOrderMaterial[]>(
    response,
    PACKING_WEIGHT_RULE_MESSAGE.materialLoadFailed
  );
};
