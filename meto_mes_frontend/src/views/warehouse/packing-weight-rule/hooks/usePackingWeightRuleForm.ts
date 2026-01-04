import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { ref } from "vue";
import {
  PACKING_WEIGHT_RULE_FORM_MODE,
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

  const rules: FormRules<PackingWeightRuleFormState> = {
    productCode: [
      {
        required: true,
        message: PACKING_WEIGHT_RULE_MESSAGE.submitFailed,
        trigger: "blur"
      }
    ],
    fullBoxQuantity: [
      {
        required: true,
        message: PACKING_WEIGHT_RULE_MESSAGE.submitFailed,
        trigger: "blur"
      }
    ],
    singleProductWeight: [
      {
        required: true,
        message: PACKING_WEIGHT_RULE_MESSAGE.submitFailed,
        trigger: "blur"
      }
    ],
    fullBoxPackageWeight: [
      {
        required: true,
        message: PACKING_WEIGHT_RULE_MESSAGE.submitFailed,
        trigger: "blur"
      }
    ],
    allowedDeviation: [
      {
        required: true,
        message: PACKING_WEIGHT_RULE_MESSAGE.submitFailed,
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
      console.log(mode.value, activeId.value)
      if (mode.value === PACKING_WEIGHT_RULE_FORM_MODE.create) {
        await createPackingWeightRule(formState.value);
        notifyCreateSuccess();
      } else if (activeId.value !== null) {
        await updatePackingWeightRule(activeId.value, formState.value);
        notifyUpdateSuccess();
      }
      await options.onSubmitted?.();
      closeDialog();
    } catch (error) {
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
