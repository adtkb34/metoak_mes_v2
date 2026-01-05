import {
  ElMessage,
  type FormInstance,
  type FormItemRule,
  type FormRules
} from "element-plus";
import { ref } from "vue";
import {
  PACKING_WEIGHT_RULE_FORM_MODE,
  PACKING_WEIGHT_RULE_ALLOWED_DEVIATION_LIMIT_MESSAGE,
  PACKING_WEIGHT_RULE_MESSAGE
} from "../packingWeightRule.constants";
import {
  createPackingWeightRule,
  updatePackingWeightRule
} from "../services/packingWeightRule.api";
import {
  buildDefaultPackingWeightRuleForm,
  notifyCreateSuccess,
  notifyUpdateSuccess,
  resolveRuleToFormState
} from "../services/packingWeightRule.service";
import type {
  PackingWeightRule,
  PackingWeightRuleFormMode,
  PackingWeightRuleFormState
} from "../types";

interface UsePackingWeightRuleFormOptions {
  onSubmitted?: () => Promise<void> | void;
}

export const usePackingWeightRuleForm = (
  options: UsePackingWeightRuleFormOptions = {}
) => {
  const formRef = ref<FormInstance>();
  const dialogVisible = ref(false);
  const mode = ref<PackingWeightRuleFormMode>(
    PACKING_WEIGHT_RULE_FORM_MODE.create
  );
  const submitting = ref(false);
  const formState = ref<PackingWeightRuleFormState>(
    buildDefaultPackingWeightRuleForm()
  );
  const activeId = ref<number | null>(null);

  const validateAllowedDeviation: FormItemRule["validator"] = (
    _rule,
    value,
    callback
  ) => {
    const deviation = value as number | null;
    const singleWeight = formState.value.unitWeight;
    if (deviation === null || singleWeight === null) {
      callback();
      return;
    }
    if (deviation > singleWeight) {
      callback(new Error(PACKING_WEIGHT_RULE_ALLOWED_DEVIATION_LIMIT_MESSAGE));
      return;
    }
    callback();
  };

  const rules: FormRules<PackingWeightRuleFormState> = {
    productCode: [
      {
        required: true,
        message: PACKING_WEIGHT_RULE_MESSAGE.submitFailed,
        trigger: "blur"
      }
    ],
    specQuantity: [
      {
        required: true,
        message: PACKING_WEIGHT_RULE_MESSAGE.submitFailed,
        trigger: "blur"
      }
    ],
    unitWeight: [
      {
        required: true,
        message: PACKING_WEIGHT_RULE_MESSAGE.submitFailed,
        trigger: "blur"
      }
    ],
    tareWeight: [
      {
        required: true,
        message: PACKING_WEIGHT_RULE_MESSAGE.submitFailed,
        trigger: "blur"
      }
    ],
    weightTolerance: [
      {
        required: true,
        message: PACKING_WEIGHT_RULE_MESSAGE.submitFailed,
        trigger: "blur"
      },
      {
        validator: validateAllowedDeviation,
        trigger: "blur"
      }
    ],
    unit: [
      {
        required: true,
        message: PACKING_WEIGHT_RULE_MESSAGE.submitFailed,
        trigger: "change"
      }
    ]
  };

  const openCreate = () => {
    dialogVisible.value = true;
    mode.value = PACKING_WEIGHT_RULE_FORM_MODE.create;
    activeId.value = null;
    formState.value = buildDefaultPackingWeightRuleForm();
  };

  const openEdit = (rule: PackingWeightRule) => {
    dialogVisible.value = true;
    mode.value = PACKING_WEIGHT_RULE_FORM_MODE.update;
    activeId.value = rule.id;
    formState.value = resolveRuleToFormState(rule);
  };

  const closeDialog = () => {
    dialogVisible.value = false;
  };

  const updateFormState = (state: PackingWeightRuleFormState) => {
    formState.value = state;
  };

  const submit = async () => {
    submitting.value = true;
    try {
      if (mode.value === PACKING_WEIGHT_RULE_FORM_MODE.create) {
        await createPackingWeightRule(formState.value);
        notifyCreateSuccess();
      } else if (activeId.value !== null) {
        await updatePackingWeightRule(activeId.value, formState.value);
        notifyUpdateSuccess();
      }
      await options.onSubmitted?.();
      closeDialog();
    } catch (error: Error | string | number | boolean | null | undefined) {
      if (error instanceof Error) {
        ElMessage.error(error.message);
      } else {
        ElMessage.error(PACKING_WEIGHT_RULE_MESSAGE.submitFailed);
      }
    } finally {
      submitting.value = false;
    }
  };

  return {
    formRef,
    dialogVisible,
    mode,
    formState,
    rules,
    submitting,
    openCreate,
    openEdit,
    closeDialog,
    updateFormState,
    submit
  };
};
