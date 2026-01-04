<script setup lang="ts">
import { ElButton } from "element-plus";
import PackingWeightRuleForm from "./components/PackingWeightRuleForm.vue";
import PackingWeightRuleTable from "./components/PackingWeightRuleTable.vue";
import { usePackingWeightRuleForm } from "./hooks/usePackingWeightRuleForm";
import { usePackingWeightRules } from "./hooks/usePackingWeightRules";
import { useWorkOrderMaterialOptions } from "./hooks/useWorkOrderMaterialOptions";
import {
  PACKING_WEIGHT_RULE_CREATE_LABEL,
  PACKING_WEIGHT_RULE_LAYOUT_GAP,
  PACKING_WEIGHT_RULE_PAGE_TITLE,
  PACKING_WEIGHT_RULE_PADDING
} from "./packingWeightRule.constants";
import type { PackingWeightRule } from "./types";

defineOptions({
  name: "PackingWeightRulePage"
});

const ruleList = usePackingWeightRules();
const materialOptions = useWorkOrderMaterialOptions();
const ruleForm = usePackingWeightRuleForm({
  onSubmitted: ruleList.loadRules
});

const layoutGap = PACKING_WEIGHT_RULE_LAYOUT_GAP;
const layoutPadding = PACKING_WEIGHT_RULE_PADDING;

const handleAddRule = () => {
  ruleForm.openCreate();
};

const handleEditRule = (rule: PackingWeightRule) => {
  ruleForm.openEdit(rule);
};

const handleDialogClose = () => {
  ruleForm.closeDialog();
};

const handleSubmit = async () => {
  await ruleForm.submit();
};
</script>

<template>
  <div
    class="packing-weight-rule-page"
    :style="{ gap: `${layoutGap}px`, padding: `${layoutPadding}px` }"
  >
    <div class="page-header">
      <h3 class="page-title">{{ PACKING_WEIGHT_RULE_PAGE_TITLE }}</h3>
      <ElButton type="primary" @click="handleAddRule">
        {{ PACKING_WEIGHT_RULE_CREATE_LABEL }}
      </ElButton>
    </div>

    <PackingWeightRuleTable
      :data="ruleList.rules.value"
      :loading="ruleList.loading.value"
      @edit="handleEditRule"
    />

    <PackingWeightRuleForm
      :visible="ruleForm.dialogVisible.value"
      :mode="ruleForm.mode.value"
      :form-state="ruleForm.formState.value"
      :rules="ruleForm.rules"
      :submitting="ruleForm.submitting.value"
      :product-options="materialOptions.options.value"
      :product-options-loading="materialOptions.loading.value"
      @close="handleDialogClose"
      @submit="handleSubmit"
      @update:form-state="ruleForm.updateFormState"
    />
  </div>
</template>

<style scoped lang="scss">
.packing-weight-rule-page {
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
</style>
