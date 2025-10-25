<template>
  <div class="filters-panel">
    <el-form :inline="true" label-width="80px" class="filter-form">
      <el-form-item label="时间范围">
        <el-date-picker
          class="filter-date-picker"
          type="daterange"
          unlink-panels
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :disabled="loading"
          :model-value="dateRange"
          @update:model-value="onDateRangeChange"
        />
      </el-form-item>
      <el-form-item label="产地">
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
      </el-form-item>
      <el-form-item label="产品">
        <el-select
          class="filter-select"
          clearable
          filterable
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
      </el-form-item>
      <el-form-item label="工艺">
        <el-select
          class="filter-select"
          multiple
          collapse-tags
          collapse-tags-tooltip
          clearable
          filterable
          placeholder="选择工艺"
          :disabled="loading || !product"
          :model-value="processSteps"
          @update:model-value="onProcessStepsChange"
        >
          <el-option
            v-for="item in processOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
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
  product: string | null;
  origin: ProductOrigin | null;
  productOptions: SelectOption[];
  processOptions: SelectOption[];
  processSteps: string[];
  originOptions: SelectOption[];
  loading?: boolean;
}

const props = defineProps<Props>();
const {
  dateRange,
  product,
  origin,
  productOptions,
  processOptions,
  processSteps,
  originOptions,
  loading
} = toRefs(props);
const emit = defineEmits([
  "update:dateRange",
  "update:product",
  "update:origin",
  "update:processSteps",
  "submit",
  "reset"
]);

const onDateRangeChange = (value: string[] | null) => {
  emit("update:dateRange", value ?? []);
};

const onProductChange = (value: string | null) => {
  emit("update:product", value ?? null);
};

const onOriginChange = (value: ProductOrigin | null) => {
  emit("update:origin", value ?? null);
};

const onProcessStepsChange = (value: Array<string | number> | null) => {
  const nextValue = Array.isArray(value) ? value.map(item => String(item)) : [];
  emit("update:processSteps", nextValue);
};
</script>

<style scoped>
.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.filters-panel {
  width: 100%;
}

.filter-date-picker {
  width: 320px;
  max-width: 100%;
}

.filter-select {
  min-width: 220px;
  width: 240px;
  max-width: 100%;
}
</style>
