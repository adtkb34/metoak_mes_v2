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
                {{ formatTitle(item) }}
              </div>
              <div class="mt-1 text-xs text-gray-400">
                {{ getMetaLabel(item) }} {{ getMetaValue(item) }}
              </div>
            </div>
            <el-tag size="small" effect="plain" type="info">指标概览</el-tag>
          </div>
          <div class="mt-4 space-y-3">
            <div
              v-for="group in metricGroups"
              :key="group.key"
              class="metric-group"
            >
              <div class="text-xs font-medium text-gray-500">
                {{ group.label }}
              </div>
              <div class="mt-2 grid grid-cols-3 gap-3 text-sm">
                <div
                  v-for="metric in group.items"
                  :key="metric.key"
                  class="metric-item"
                >
                  <div class="text-gray-400">{{ metric.label }}</div>
                  <div :class="['metric-value', getMetricClass(group.key)]">
                    {{ formatMetricValue(group.key, metric.key, item.metrics) }}
                  </div>
                </div>
              </div>
            </div>
            <div v-if="showWip" class="metric-group">
              <div class="text-xs font-medium text-gray-500">WIP</div>
              <div v-if="item.metrics.WIP?.length" class="mt-2 space-y-2">
                <div
                  v-for="wip in item.metrics.WIP"
                  :key="`${wip.productCode}-${wip.workOrderMaterialCode ?? ''}`"
                  class="flex items-start justify-between rounded-md border border-gray-100 bg-white px-3 py-2"
                >
                  <div class="space-y-1">
                    <div class="text-gray-600">{{ wip.productCode }}</div>
                    <div v-if="wip.workOrderMaterialCode" class="text-xs text-gray-400">
                      工单物料号：{{ wip.workOrderMaterialCode }}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-semibold text-indigo-600">
                      {{ formatWipQuantity(wip.goodQuantity) }}
                      <span class="mx-1 text-xs text-gray-400">/</span>
                      <span class="text-sm font-medium text-gray-500">
                        {{ formatWipQuantity(wip.plannedQuantity) }}
                      </span>
                    </div>
                    <div class="text-xs text-gray-400">
                      完成率：
                      <span class="text-gray-600">
                        {{ formatCompletionRate(wip.goodQuantity, wip.plannedQuantity) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="mt-2 text-xs text-gray-400">暂无 WIP 数据</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from "vue";
import type { ProcessMetricsSummary, ProcessOverviewItem } from "../types";

interface Props {
  processes: ProcessOverviewItem[];
  loading?: boolean;
  showWip?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (event: "select", id: string): void;
}>();
const { processes, loading, showWip } = toRefs(props);

const METRIC_GROUPS = [
  {
    key: "数量",
    label: "产量",
    items: [
      { key: "良品", label: "良品" },
      { key: "产品", label: "产品" }
      // { key: "总体", label: "总体" }
    ]
  },
  {
    key: "良率",
    label: "良率",
    items: [
      { key: "一次", label: "一次" },
      { key: "最终", label: "最终" }
      // { key: "总体", label: "总体" }
    ]
  }
  // {
  //   key: "良品用时",
  //   label: "良品用时 (秒)",
  //   items: [
  //     { key: "min", label: "最短" },
  //     { key: "mean", label: "平均" },
  //     { key: "max", label: "最长" }
  //   ]
  // }
] as const;

const numberFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 0
});

const metricGroups = METRIC_GROUPS;

const formatTitle = (item: ProcessOverviewItem) => {
  if (!item.titleLabel) {
    return item.name;
  }
  return `${item.titleLabel} ${item.name}`;
};

const getMetaLabel = (item: ProcessOverviewItem) => {
  return item.metaLabel ?? "工序编码";
};

const getMetaValue = (item: ProcessOverviewItem) => {
  const value = item.metaValue ?? item.code;
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return typeof value === "string" ? value : String(value);
};

const formatMetricValue = (
  groupKey: string,
  metricKey: string,
  summary: ProcessMetricsSummary
): string => {
  const group = summary[groupKey as keyof ProcessMetricsSummary] as
    | Record<string, number | string>
    | undefined;
  const rawValue = group?.[metricKey] ?? "-";

  if (typeof rawValue !== "number") {
    return String(rawValue);
  }

  if (groupKey === "良率") {
    return `${(rawValue * 100).toFixed(1)}%`;
  }

  if (groupKey === "良品用时") {
    return `${Math.round(rawValue)}s`;
  }

  return numberFormatter.format(rawValue);
};

const getMetricClass = (groupKey: string) => {
  if (groupKey === "良率") {
    return "text-emerald-600";
  }
  if (groupKey === "良品用时") {
    return "text-indigo-600";
  }
  return "text-gray-700";
};

const parseNumericValue = (value: number | string | undefined): number | null => {
  if (typeof value === "number") return value;
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatWipQuantity = (value: number | string | undefined) => {
  if (typeof value === "number") {
    return numberFormatter.format(value);
  }
  if (value === undefined || value === null) {
    return "-";
  }
  return String(value);
};

const formatCompletionRate = (
  goodQuantity: number | string | undefined,
  plannedQuantity: number | string | undefined
) => {
  const good = parseNumericValue(goodQuantity);
  const planned = parseNumericValue(plannedQuantity);
  if (good === null || planned === null || planned <= 0) {
    return "-";
  }
  return `${((good / planned) * 100).toFixed(1)}%`;
};
</script>

<style scoped>
.process-card {
  @apply rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg;
  cursor: pointer;
}

.metric-group {
  @apply rounded-md border border-gray-100 bg-gray-50 p-3;
}

.metric-item .metric-value {
  @apply mt-1 text-lg font-semibold;
}
</style>
