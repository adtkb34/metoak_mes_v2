import type { FormRules } from "element-plus";
import type {
  PACKING_WEIGHT_RULE_FORM_MODE,
  PACKING_WEIGHT_RULE_UNIT_OPTIONS
} from "./packingWeightRule.constants";

type ValueOf<T> = T[keyof T];

export type PackingWeightRuleFormMode = ValueOf<
  typeof PACKING_WEIGHT_RULE_FORM_MODE
>;

export interface PackingWeightRule {
  id: number;
  productCode: string;
  fullBoxQuantity: number;
  singleProductWeight: number;
  fullBoxPackageWeight: number;
  allowedDeviation: number;
  unit: (typeof PACKING_WEIGHT_RULE_UNIT_OPTIONS)[number]["value"];
  createdAt?: string;
  updatedAt?: string;
}

export interface PackingWeightRuleFormState {
  productCode: string;
  fullBoxQuantity: number | null;
  singleProductWeight: number | null;
  fullBoxPackageWeight: number | null;
  allowedDeviation: number | null;
  unit: (typeof PACKING_WEIGHT_RULE_UNIT_OPTIONS)[number]["value"];
}

export interface PackingWeightRuleFormContext {
  visible: boolean;
  mode: PackingWeightRuleFormMode;
  submitting: boolean;
  formState: PackingWeightRuleFormState;
  rules: FormRules<PackingWeightRuleFormState>;
}

export interface WorkOrderMaterial {
  materialCode: string;
  materialName: string;
}

export interface ProductOption {
  value: string;
  label: string;
}
