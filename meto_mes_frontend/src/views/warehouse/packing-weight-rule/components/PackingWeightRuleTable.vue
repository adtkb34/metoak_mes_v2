<script setup lang="ts">
import {
  PACKING_WEIGHT_RULE_ACTIONS_LABEL,
  PACKING_WEIGHT_RULE_ALLOWED_DEVIATION_LABEL,
  PACKING_WEIGHT_RULE_CARD_HEADER,
  PACKING_WEIGHT_RULE_CREATED_AT_LABEL,
  PACKING_WEIGHT_RULE_EDIT_LABEL,
  PACKING_WEIGHT_RULE_INDEX_COLUMN_WIDTH,
  PACKING_WEIGHT_RULE_ACTION_COLUMN_WIDTH,
  PACKING_WEIGHT_RULE_FULL_BOX_QUANTITY_LABEL,
  PACKING_WEIGHT_RULE_PACKAGE_WEIGHT_LABEL,
  PACKING_WEIGHT_RULE_PRODUCT_CODE_LABEL,
  PACKING_WEIGHT_RULE_SINGLE_WEIGHT_LABEL,
  PACKING_WEIGHT_RULE_TABLE_HEIGHT,
  PACKING_WEIGHT_RULE_UPDATED_AT_LABEL,
  PACKING_WEIGHT_RULE_UNIT_LABEL
} from "../packingWeightRule.constants";
import type { PackingWeightRule } from "../types";

defineProps<{
  data: PackingWeightRule[];
  loading: boolean;
}>();

const emit = defineEmits<{ (event: "edit", rule: PackingWeightRule): void }>();

const handleEdit = (row: PackingWeightRule) => {
  emit("edit", row);
};
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>{{ PACKING_WEIGHT_RULE_CARD_HEADER }}</span>
      </div>
    </template>

    <el-table
      :data="data"
      stripe
      :border="true"
      :loading="loading"
      :height="PACKING_WEIGHT_RULE_TABLE_HEIGHT"
    >
      <el-table-column
        type="index"
        :width="PACKING_WEIGHT_RULE_INDEX_COLUMN_WIDTH"
        align="center"
      />
      <el-table-column
        prop="productCode"
        :label="PACKING_WEIGHT_RULE_PRODUCT_CODE_LABEL"
        align="center"
      />
      <el-table-column
        prop="fullBoxQuantity"
        :label="PACKING_WEIGHT_RULE_FULL_BOX_QUANTITY_LABEL"
        align="center"
      />
      <el-table-column
        prop="singleProductWeight"
        :label="PACKING_WEIGHT_RULE_SINGLE_WEIGHT_LABEL"
        align="center"
      />
      <el-table-column
        prop="fullBoxPackageWeight"
        :label="PACKING_WEIGHT_RULE_PACKAGE_WEIGHT_LABEL"
        align="center"
      />
      <el-table-column
        prop="allowedDeviation"
        :label="PACKING_WEIGHT_RULE_ALLOWED_DEVIATION_LABEL"
        align="center"
      />
      <el-table-column
        prop="unit"
        :label="PACKING_WEIGHT_RULE_UNIT_LABEL"
        align="center"
      />
      <el-table-column
        prop="createdAt"
        :label="PACKING_WEIGHT_RULE_CREATED_AT_LABEL"
        align="center"
      />
      <el-table-column
        prop="updatedAt"
        :label="PACKING_WEIGHT_RULE_UPDATED_AT_LABEL"
        align="center"
      />
      <el-table-column
        fixed="right"
        :label="PACKING_WEIGHT_RULE_ACTIONS_LABEL"
        :width="PACKING_WEIGHT_RULE_ACTION_COLUMN_WIDTH"
      >
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">
            {{ PACKING_WEIGHT_RULE_EDIT_LABEL }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped lang="scss">
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}
</style>
