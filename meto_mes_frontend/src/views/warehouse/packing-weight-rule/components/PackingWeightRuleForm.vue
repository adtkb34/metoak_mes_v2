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
  PACKING_WEIGHT_RULE_PRODUCT_PLACEHOLDER,
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
  PackingWeightRuleFormState,
  ProductOption
} from "../types";

const props = defineProps<{
  visible: boolean;
  mode: PackingWeightRuleFormMode;
  formState: PackingWeightRuleFormState;
  rules: FormRules<PackingWeightRuleFormState>;
  submitting: boolean;
  productOptions: ProductOption[];
  productOptionsLoading: boolean;
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
        <el-select
          :model-value="formState.productCode"
          filterable
          :placeholder="PACKING_WEIGHT_RULE_PRODUCT_PLACEHOLDER"
          :loading="productOptionsLoading"
          @update:model-value="value => updateField('productCode', value)"
        >
          <el-option
            v-for="item in productOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        prop="specQuantity"
        :label="PACKING_WEIGHT_RULE_FULL_BOX_QUANTITY_LABEL"
      >
        <el-input-number
          :model-value="formState.specQuantity"
          :min="PACKING_WEIGHT_RULE_NUMBER_MIN"
          controls-position="right"
          @update:model-value="
            value => updateField('specQuantity', value ?? null)
          "
        />
      </el-form-item>

      <el-form-item
        prop="unitWeight"
        :label="PACKING_WEIGHT_RULE_SINGLE_WEIGHT_LABEL"
      >
        <el-input-number
          :model-value="formState.unitWeight"
          :precision="PACKING_WEIGHT_RULE_NUMBER_PRECISION"
          :step="PACKING_WEIGHT_RULE_NUMBER_STEP"
          :min="PACKING_WEIGHT_RULE_NUMBER_MIN"
          controls-position="right"
          @update:model-value="
            value => updateField('unitWeight', value ?? null)
          "
        />
      </el-form-item>

      <el-form-item
        prop="tareWeight"
        :label="PACKING_WEIGHT_RULE_PACKAGE_WEIGHT_LABEL"
      >
        <el-input-number
          :model-value="formState.tareWeight"
          :precision="PACKING_WEIGHT_RULE_NUMBER_PRECISION"
          :step="PACKING_WEIGHT_RULE_NUMBER_STEP"
          :min="PACKING_WEIGHT_RULE_NUMBER_MIN"
          controls-position="right"
          @update:model-value="
            value => updateField('tareWeight', value ?? null)
          "
        />
      </el-form-item>

      <el-form-item
        prop="weightTolerance"
        :label="PACKING_WEIGHT_RULE_ALLOWED_DEVIATION_LABEL"
      >
        <el-input-number
          :model-value="formState.weightTolerance"
          :precision="PACKING_WEIGHT_RULE_NUMBER_PRECISION"
          :step="PACKING_WEIGHT_RULE_NUMBER_STEP"
          :min="PACKING_WEIGHT_RULE_NUMBER_MIN"
          controls-position="right"
          @update:model-value="
            value => updateField('weightTolerance', value ?? null)
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
