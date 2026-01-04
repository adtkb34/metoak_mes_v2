<script setup lang="ts">
import {
  PACKING_WEIGHT_RULE_ALLOWED_DEVIATION_LABEL,
  PACKING_WEIGHT_RULE_CANCEL_LABEL,
  PACKING_WEIGHT_RULE_DIALOG_TITLE,
  PACKING_WEIGHT_RULE_FORM_WIDTH,
  PACKING_WEIGHT_RULE_FORM_LABEL_WIDTH,
  PACKING_WEIGHT_RULE_FULL_BOX_QUANTITY_LABEL,
  PACKING_WEIGHT_RULE_PACKAGE_WEIGHT_LABEL,
  PACKING_WEIGHT_RULE_PRODUCT_CODE_LABEL,
  PACKING_WEIGHT_RULE_SINGLE_WEIGHT_LABEL,
  PACKING_WEIGHT_RULE_SUBMIT_LABEL,
  PACKING_WEIGHT_RULE_NUMBER_MIN,
  PACKING_WEIGHT_RULE_NUMBER_PRECISION,
  PACKING_WEIGHT_RULE_NUMBER_STEP,
  PACKING_WEIGHT_RULE_UNIT_LABEL,
  PACKING_WEIGHT_RULE_UNIT_OPTIONS
} from "../packingWeightRule.constants";
import type { FormRules } from "element-plus";
import { computed } from "vue";
import type {
  PackingWeightRuleFormMode,
  PackingWeightRuleFormState
} from "../types";

const props = defineProps<{
  visible: boolean;
  mode: PackingWeightRuleFormMode;
  formState: PackingWeightRuleFormState;
  rules: FormRules<PackingWeightRuleFormState>;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "submit"): void;
  (event: "update:form-state", value: PackingWeightRuleFormState): void;
}>();

const dialogTitle = computed(
  () => PACKING_WEIGHT_RULE_DIALOG_TITLE[props.mode]
);

const updateField = <K extends keyof PackingWeightRuleFormState>(
  key: K,
  value: PackingWeightRuleFormState[K]
) => {
  emit("update:form-state", { ...props.formState, [key]: value });
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    :width="PACKING_WEIGHT_RULE_FORM_WIDTH"
    destroy-on-close
    @close="emit('close')"
  >
    <el-form
      :model="formState"
      :label-width="PACKING_WEIGHT_RULE_FORM_LABEL_WIDTH"
      :rules="rules"
      status-icon
      class="rule-form"
    >
      <el-form-item
        prop="productCode"
        :label="PACKING_WEIGHT_RULE_PRODUCT_CODE_LABEL"
      >
        <el-input
          :model-value="formState.productCode"
          @update:model-value="value => updateField('productCode', value)"
        />
      </el-form-item>

      <el-form-item
        prop="fullBoxQuantity"
        :label="PACKING_WEIGHT_RULE_FULL_BOX_QUANTITY_LABEL"
      >
        <el-input-number
          :model-value="formState.fullBoxQuantity"
          :min="PACKING_WEIGHT_RULE_NUMBER_MIN"
          controls-position="right"
          @update:model-value="
            value => updateField('fullBoxQuantity', value ?? null)
          "
        />
      </el-form-item>

      <el-form-item
        prop="singleProductWeight"
        :label="PACKING_WEIGHT_RULE_SINGLE_WEIGHT_LABEL"
      >
        <el-input-number
          :model-value="formState.singleProductWeight"
          :precision="PACKING_WEIGHT_RULE_NUMBER_PRECISION"
          :step="PACKING_WEIGHT_RULE_NUMBER_STEP"
          :min="PACKING_WEIGHT_RULE_NUMBER_MIN"
          controls-position="right"
          @update:model-value="
            value => updateField('singleProductWeight', value ?? null)
          "
        />
      </el-form-item>

      <el-form-item
        prop="fullBoxPackageWeight"
        :label="PACKING_WEIGHT_RULE_PACKAGE_WEIGHT_LABEL"
      >
        <el-input-number
          :model-value="formState.fullBoxPackageWeight"
          :precision="PACKING_WEIGHT_RULE_NUMBER_PRECISION"
          :step="PACKING_WEIGHT_RULE_NUMBER_STEP"
          :min="PACKING_WEIGHT_RULE_NUMBER_MIN"
          controls-position="right"
          @update:model-value="
            value => updateField('fullBoxPackageWeight', value ?? null)
          "
        />
      </el-form-item>

      <el-form-item
        prop="allowedDeviation"
        :label="PACKING_WEIGHT_RULE_ALLOWED_DEVIATION_LABEL"
      >
        <el-input-number
          :model-value="formState.allowedDeviation"
          :precision="PACKING_WEIGHT_RULE_NUMBER_PRECISION"
          :step="PACKING_WEIGHT_RULE_NUMBER_STEP"
          :min="PACKING_WEIGHT_RULE_NUMBER_MIN"
          controls-position="right"
          @update:model-value="
            value => updateField('allowedDeviation', value ?? null)
          "
        />
      </el-form-item>

      <el-form-item prop="unit" :label="PACKING_WEIGHT_RULE_UNIT_LABEL">
        <el-select
          :model-value="formState.unit"
          placeholder=""
          @update:model-value="value => updateField('unit', value)"
        >
          <el-option
            v-for="item in PACKING_WEIGHT_RULE_UNIT_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="emit('close')">{{
          PACKING_WEIGHT_RULE_CANCEL_LABEL
        }}</el-button>
        <el-button type="primary" :loading="submitting" @click="emit('submit')">
          {{ PACKING_WEIGHT_RULE_SUBMIT_LABEL }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.rule-form {
  padding-right: 12px;
}
</style>
