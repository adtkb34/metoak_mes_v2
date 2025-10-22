<template>
  <div class="process-overview">
    <el-skeleton v-if="loading" animated :rows="4" />
    <template v-else>
      <el-empty v-if="!processes.length" description="暂无工序数据" />
      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="item in processes"
          :key="item.id"
          class="process-card"
          @click="() => emit('select', item.id)"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="text-base font-medium text-gray-700">
                {{ item.name }}
              </div>
              <div class="mt-1 text-xs text-gray-400">
                目标产量 {{ formatNumber(item.targetOutput) }} 台
              </div>
            </div>
            <el-tag :type="item.trend >= 0 ? 'success' : 'danger'" size="small" effect="plain">
              {{ item.trend >= 0 ? '+' : '' }}{{ item.trend.toFixed(1) }}%
            </el-tag>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div class="text-gray-400">产量</div>
              <div class="mt-1 text-xl font-semibold text-gray-700">
                {{ formatNumber(item.output) }}
              </div>
            </div>
            <div>
              <div class="text-gray-400">在制</div>
              <div class="mt-1 text-xl font-semibold text-gray-700">
                {{ formatNumber(item.wip) }}
              </div>
            </div>
            <div>
              <div class="text-gray-400">一次良率</div>
              <div class="mt-1 text-lg font-semibold text-emerald-600">
                {{ formatPercent(item.firstPassYield) }}
              </div>
            </div>
            <div>
              <div class="text-gray-400">最终良率</div>
              <div class="mt-1 text-lg font-semibold text-blue-600">
                {{ formatPercent(item.finalYield) }}
              </div>
            </div>
          </div>
          <el-progress
            class="mt-4"
            :stroke-width="10"
            :percentage="computeCompletion(item.output, item.targetOutput)"
            :status="item.output >= item.targetOutput ? 'success' : undefined"
            striped
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from "vue";
import type { ProcessMetric } from "../types";

interface Props {
  processes: ProcessMetric[];
  loading?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (event: "select", id: string): void;
}>();
const { processes, loading } = toRefs(props);

const numberFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 0
});

const formatNumber = (value: number) => numberFormatter.format(value);
const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
const computeCompletion = (output: number, target: number) => {
  if (!target) return 0;
  return Math.min(100, Math.round((output / target) * 100));
};

</script>

<style scoped>
.process-card {
  @apply rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg;
  cursor: pointer;
}
</style>
