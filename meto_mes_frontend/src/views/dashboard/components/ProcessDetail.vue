<template>
  <div class="process-detail">
    <el-skeleton v-if="loading" animated :rows="6" />
    <template v-else>
      <div class="space-y-6">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="stat-card">
            <div class="text-sm font-medium text-gray-500">产量</div>
            <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div
                v-for="item in quantityMetricItems"
                :key="item.key"
                class="space-y-1"
              >
                <div class="text-gray-400">{{ item.label }}</div>
                <div class="text-xl font-semibold text-gray-700">
                  {{ formatQuantityMetric(metricsSummary.数量[item.key]) }}
                </div>
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="text-sm font-medium text-gray-500">良率</div>
            <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div
                v-for="item in yieldMetricItems"
                :key="item.key"
                class="space-y-1"
              >
                <div class="text-gray-400">{{ item.label }}</div>
                <div class="text-xl font-semibold text-emerald-600">
                  {{ formatYieldMetric(metricsSummary.良率[item.key]) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pareto-card">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-base font-medium text-gray-700">柏拉图</h3>
            <span class="text-xs text-gray-400"
              >累计占比 80% 对应的缺陷集中度</span
            >
          </div>
          <el-empty v-if="!hasParetoData" description="暂无缺陷数据" />
          <v-chart v-else class="h-[320px]" :option="chartOption" autoresize />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { use } from "echarts/core";
import VChart from "vue-echarts";
import { BarChart, LineChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { ParetoChartData, ProcessMetricsSummary } from "../types";

use([
  BarChart,
  LineChart,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer
]);

const EMPTY_METRICS_SUMMARY: ProcessMetricsSummary = {
  数量: { 良品: "-", 产品: "-", 总体: "-" },
  良率: { 一次: "-", 最终: "-", 总体: "-" },
  良品用时: { mean: "-", min: "-", max: "-" }
};

const EMPTY_PARETO_DATA: ParetoChartData = {
  categories: [],
  counts: [],
  cumulative: []
};

const quantityMetricItems = [
  { key: "良品", label: "良品" },
  { key: "产品", label: "产品" },
  { key: "总体", label: "总体" }
] as const;

const yieldMetricItems = [
  { key: "一次", label: "一次" },
  { key: "最终", label: "最终" },
  { key: "总体", label: "总体" }
] as const;

const props = defineProps<{
  loading?: boolean;
  metrics?: ProcessMetricsSummary | null;
  pareto?: ParetoChartData | null;
}>();

const metricsSummary = computed<ProcessMetricsSummary>(() => {
  if (props.metrics) {
    return props.metrics;
  }

  return EMPTY_METRICS_SUMMARY;
});

const paretoData = computed<ParetoChartData>(
  () => props.pareto ?? EMPTY_PARETO_DATA
);
const hasParetoData = computed(() => paretoData.value.categories.length > 0);

const chartOption = computed(() => {
  if (!paretoData.value.categories.length) {
    return {};
  }
  return {
    tooltip: {
      trigger: "axis"
    },
    legend: {
      data: ["不良数", "累计占比"]
    },
    grid: {
      top: 50,
      left: "6%",
      right: "8%",
      bottom: 30
    },
    xAxis: {
      type: "category",
      data: paretoData.value.categories,
      axisLabel: {
        interval: 0,
        rotate: 20
      }
    },
    yAxis: [
      {
        type: "value",
        name: "不良数",
        minInterval: 1
      },
      {
        type: "value",
        name: "累计占比",
        min: 0,
        max: 100,
        axisLabel: {
          formatter: "{value}%"
        }
      }
    ],
    series: [
      {
        name: "不良数",
        type: "bar",
        data: paretoData.value.counts,
        itemStyle: {
          color: "#409EFF"
        }
      },
      {
        name: "累计占比",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        data: paretoData.value.cumulative,
        itemStyle: {
          color: "#F56C6C"
        }
      }
    ]
  };
});

const numberFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 0
});

const formatQuantityMetric = (value: number | string) => {
  if (typeof value === "number") {
    return numberFormatter.format(value);
  }
  return value ?? "-";
};

const formatYieldMetric = (value: number | string) => {
  if (typeof value === "number") {
    return `${(value * 100).toFixed(1)}%`;
  }
  return value ?? "-";
};
</script>

<style scoped>
.stat-card {
  @apply rounded-lg border border-gray-200 bg-white p-4 shadow-sm;
}

.pareto-card {
  @apply rounded-lg border border-gray-200 bg-white p-4 shadow-sm;
}
</style>
