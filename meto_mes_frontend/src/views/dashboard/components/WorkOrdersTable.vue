<template>
  <div class="work-orders-table">
    <el-skeleton v-if="loading" animated :rows="6" />
    <template v-else>
      <el-empty v-if="!workOrders.length" description="暂无工单数据" />
      <el-table v-else :data="workOrders" stripe>
        <el-table-column prop="orderId" label="工单号" width="140" />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="product" label="产品" width="110" />
        <el-table-column prop="origin" label="产地" width="110" />
        <el-table-column label="预期完成数" width="130">
          <template #default="{ row }">
            {{ formatNumber(row.expectedQuantity) }}
          </template>
        </el-table-column>
        <el-table-column label="AA通过数" width="120">
          <template #default="{ row }">
            {{ formatNumber(row.aaPass) }}
          </template>
        </el-table-column>
        <el-table-column label="标定通过数" width="130">
          <template #default="{ row }">
            {{ formatNumber(row.calibrationPass) }}
          </template>
        </el-table-column>
        <el-table-column label="终检通过数" width="130">
          <template #default="{ row }">
            {{ formatNumber(row.finalPass) }}
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="预计完成" width="130" />
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

const formatNumber = (value: number) => numberFormatter.format(value);
</script>

<style scoped>
.work-orders-table {
  width: 100%;
}
</style>
