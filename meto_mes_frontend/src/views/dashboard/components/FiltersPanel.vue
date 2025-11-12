<template>
  <div class="filters-panel">
    <el-form :inline="true" label-width="80px" class="filter-form">
      <el-form-item label="时间">
        <el-date-picker
          class="filter-select"
          type="daterange"
          unlink-panels
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD"
          :disabled="loading"
          :model-value="dateRange"
          @update:model-value="onDateRangeChange"
        />
      </el-form-item>
      <!-- <el-form-item label="产地">
        <el-select
          class="filter-select"
          clearable
          filterable
          placeholder="选择产地"
          :disabled="loading || !originOptions.length"
          :model-value="origin"
          @update:model-value="onOriginChange"
        >
          <el-option
            v-for="item in originOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item> -->
      <!-- <el-form-item v-if="showProduct" label="产品">
        <el-select
          class="filter-select"
          clearable
          filterable
          :multiple="productMultiple"
          placeholder="选择产品"
          :disabled="loading || !productOptions.length"
          :model-value="product"
          @update:model-value="onProductChange"
        >
          <el-option
            v-for="item in productOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item> -->
      <el-form-item v-if="showProcess" label="工艺">
        <el-select
          class="filter-select"
          clearable
          filterable
          placeholder="选择工艺"
          :disabled="loading || !(product && product.length)"
          :model-value="processCode"
          @update:model-value="onProcessCodeChange"
        >
          <el-option
            v-for="item in processOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item class="filter-actions">
        <div class="flex gap-2">
          <el-button type="primary" :loading="loading" @click="emit('submit')">
            查询
          </el-button>
          <el-button :disabled="loading" @click="emit('reset')">
            重置
          </el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from "vue";
import type { ProductOrigin } from "@/enums/product-origin";
import type { SelectOption } from "../types";

interface Props {
  dateRange: string[];
  product: string[];
  origin: ProductOrigin | null;
  productOptions: SelectOption[];
  processOptions: SelectOption[];
  processCode: string | null;
  originOptions: SelectOption[];
  loading?: boolean;
  showProduct?: boolean;
  showProcess?: boolean;
  productMultiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showProduct: true,
  showProcess: true,
  productMultiple: true
});
const {
  dateRange,
  product,
  origin,
  productOptions,
  processOptions,
  processCode,
  originOptions,
  loading,
  showProduct,
  showProcess,
  productMultiple
} = toRefs(props);
const emit = defineEmits([
  "update:dateRange",
  "update:product",
  "update:origin",
  "update:processCode",
  "submit",
  "reset"
]);

const onDateRangeChange = (value: string[] | null) => {
  emit("update:dateRange", value ?? []);
};

const onProductChange = (
  value: Array<string | number> | string | number | null
) => {
  if (Array.isArray(value)) {
    if (!value.length) {
      emit("update:product", []);
      return;
    }

    const normalized = value.map(item => String(item));
    emit("update:product", normalized);
    return;
  }

  if (value === null || value === undefined || value === "") {
    emit("update:product", []);
    return;
  }

  emit("update:product", [String(value)]);
};

const onOriginChange = (value: ProductOrigin | null) => {
  emit("update:origin", value ?? null);
};

const onProcessCodeChange = (value: string | number | null) => {
  const nextValue =
    value === null || value === undefined ? null : String(value);
  emit("update:processCode", nextValue);
};
</script>

<style scoped>
.filter-form {
  display: flex;
  flex-wrap: nowrap;
  gap: 16px;
  align-items: center;
  overflow-x: auto;
}

.filters-panel {
  width: 100%;
}

.filter-date-picker {
  width: 220px;
  max-width: 100%;
}

.filter-select {
  min-width: 180px;
  width: 200px;
  max-width: 100%;
}

.filter-actions {
  margin-left: auto;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-actions :deep(.el-form-item__content) {
  display: flex;
}
</style>
