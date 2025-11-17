<template>
  <div class="work-orders-table">
    <el-skeleton v-if="loading" animated :rows="6" />
    <template v-else>
      <el-empty v-if="!workOrders.length" description="暂无工单数据" />
      <el-table v-else :data="workOrders" stripe>
        <el-table-column prop="workOrderCode" label="工单号" width="140" />
        <el-table-column label="产品" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatProducts(row.products) }}
          </template>
        </el-table-column>
        <el-table-column label="良品数" width="120">
          <template #default="{ row }">
            {{ formatCount(row.metrics.数量.良品) }}
          </template>
        </el-table-column>
        <el-table-column label="产品数" width="120">
          <template #default="{ row }">
            {{ formatCount(row.metrics.数量.产品) }}
          </template>
        </el-table-column>
        <el-table-column label="总体数" width="120">
          <template #default="{ row }">
            {{ formatCount(row.metrics.数量.总体) }}
          </template>
        </el-table-column>
        <el-table-column label="一次良率" width="120">
          <template #default="{ row }">
            {{ formatRate(row.metrics.良率.一次) }}
          </template>
        </el-table-column>
        <el-table-column label="最终良率" width="120">
          <template #default="{ row }">
            {{ formatRate(row.metrics.良率.最终) }}
          </template>
        </el-table-column>
        <el-table-column label="总体良率" width="120">
          <template #default="{ row }">
            {{ formatRate(row.metrics.良率.总体) }}
          </template>
        </el-table-column>
      </el-table>
    </template>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from "vue";
import type { WorkOrderRow } from "../types";

interface Props {
  workOrders: WorkOrderRow[];
  loading?: boolean;
}

const props = defineProps<Props>();
const { workOrders, loading } = toRefs(props);

const numberFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 0
});

const formatCount = (value: number | string) => {
  if (typeof value !== "number") {
    return value ?? "-";
  }
  return numberFormatter.format(value);
};

const formatRate = (value: number | string) => {
  if (typeof value !== "number") {
    return value ?? "-";
  }
  return `${(value * 100).toFixed(1)}%`;
};

const formatProducts = (products: string[]) => {
  if (!products.length) return "-";
  return products.join("、");
};
</script>

<style scoped>
.work-orders-table {
  width: 100%;
}
</style>
