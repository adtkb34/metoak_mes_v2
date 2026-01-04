import { ElMessage } from "element-plus";
import {
  PACKING_WEIGHT_RULE_MESSAGE,
  PACKING_WEIGHT_RULE_UNIT_OPTIONS
} from "../packingWeightRule.constants";
import type { PackingWeightRule, PackingWeightRuleFormState } from "../types";

export const buildDefaultPackingWeightRuleForm =
  (): PackingWeightRuleFormState => ({
    productCode: "",
    fullBoxQuantity: null,
    singleProductWeight: null,
    fullBoxPackageWeight: null,
    allowedDeviation: null,
    unit: PACKING_WEIGHT_RULE_UNIT_OPTIONS[0].value
  });

export const resolveRuleToFormState = (
  rule: PackingWeightRule
): PackingWeightRuleFormState => ({
  productCode: rule.productCode,
  fullBoxQuantity: rule.fullBoxQuantity,
  singleProductWeight: rule.singleProductWeight,
  fullBoxPackageWeight: rule.fullBoxPackageWeight,
  allowedDeviation: rule.allowedDeviation,
  unit: rule.unit
});

export const notifyCreateSuccess = (): void => {
  ElMessage.success(PACKING_WEIGHT_RULE_MESSAGE.createSuccess);
};

export const notifyUpdateSuccess = (): void => {
  ElMessage.success(PACKING_WEIGHT_RULE_MESSAGE.updateSuccess);
};

export const notifyLoadFailure = (
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
  ElMessage.error(PACKING_WEIGHT_RULE_MESSAGE.loadFailed);
};
