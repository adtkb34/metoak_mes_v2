import { ElMessage } from "element-plus";
import {
  PACKING_WEIGHT_RULE_MESSAGE,
  PACKING_WEIGHT_RULE_PRODUCT_OPTION_SEPARATOR
} from "../packingWeightRule.constants";
import type { ProductOption, WorkOrderMaterial } from "../types";

export const buildProductOptions = (
  materials: WorkOrderMaterial[]
): ProductOption[] =>
  materials.map(material => ({
    value: material.materialCode,
    label: `${material.materialCode}${PACKING_WEIGHT_RULE_PRODUCT_OPTION_SEPARATOR}${material.materialName}`
  }));

export const notifyMaterialLoadFailure = (
  error: Error | string | number | boolean | null | undefined
): void => {
  if (error instanceof Error) {
    ElMessage.error(error.message);
    return;
  }
  if (typeof error === "string") {
    ElMessage.error(error);
    return;
  }
  ElMessage.error(PACKING_WEIGHT_RULE_MESSAGE.materialLoadFailed);
};
