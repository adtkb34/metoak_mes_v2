<script setup lang="ts">
import { useDark, useECharts, UtilsEChartsOption } from "@pureadmin/utils";
import { use } from "echarts/core";
import { PieChart } from "echarts/charts";
import {
  LegendComponent,
  TitleComponent,
  TooltipComponent
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { computed, ref, watch, nextTick } from "vue";
import type { Ref } from "vue";

use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
]);

defineOptions({ name: "QualityEcharts" });

const props = defineProps<{
  chartsData: Array<{ name: string; value: number }>;
}>();

const chartRef = ref<HTMLDivElement | null>(null);
const { isDark } = useDark();

const theme = computed(() => (isDark.value ? "dark" : "default"));

// 初始化 ECharts 实例 + 提供 setOptions 方法
const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>, {
  theme,
  renderer: "canvas"
});

// 响应式 options 生成器
watch(
  () => props.chartsData,
  newData => {
    nextTick(() => {
      setOptions({
        tooltip: {
          trigger: "item",
          formatter: (params: any) => {
            const { name, value, percent } = params;
            return `${name}<br/>数量: ${value}<br/>占比: ${percent}%`;
          }
        },
        legend: { top: "5%", left: "center" },
        series: [
          {
            name: "来源",
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: false,
            label: { show: false, position: "center" },
            emphasis: {
              label: { show: true, fontSize: 40, fontWeight: "bold" }
            },
            labelLine: { show: true },
            data: newData
          }
        ]
      } as UtilsEChartsOption);

    });
  },
  { immediate: true }
);
</script>

<template>
  <div ref="chartRef" style="width: 100%; height: 65vh" />
</template>
