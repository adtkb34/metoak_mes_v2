<!-- NormalFit.vue -->
<template>
  <div ref="chartRef" style="height: 400px; width: 100%"></div>
  <!-- <StatsSummary :data="props.data" /> -->
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import * as echarts from "echarts";
import { fitNormal, testNormality } from "../../utils/fit";
import StatsSummary from "./StatsSummary.vue";

const props = defineProps<{
  data: number[];
  activeTab?: string;
}>();

const chartRef = ref<HTMLDivElement | null>(null);
const chart = ref<echarts.ECharts | null>(null);

const drawChart = () => {
  if (!chartRef.value) return;
  if (!chart.value) chart.value = echarts.init(chartRef.value);

  const raw = props.data;
  const { p, isNormal } = testNormality(raw);
  const { x, y, mean, std } = fitNormal(raw);

  // 构造直方图数据
  const binCount = 20;
  const min = Math.min(...raw);
  const max = Math.max(...raw);
  const binWidth = (max - min) / binCount;
  const histogramBins = Array(binCount).fill(0);

  for (const val of raw) {
    const index = Math.min(Math.floor((val - min) / binWidth), binCount - 1);
    histogramBins[index]++;
  }

  const histogramData = histogramBins.map((count, i) => {
    const binCenter = min + (i + 0.5) * binWidth;
    return [binCenter, count];
  });

  chart.value.setOption({
    title: {
      text: `正态拟合 μ=${mean.toFixed(2)}, σ=${std.toFixed(2)} (p=${p.toFixed(3)} ${isNormal ? "正态" : "非正态"})`,
      left: "center"
    },
    tooltip: { trigger: "axis" },
    xAxis: { name: "值", type: "value" },
    yAxis: { name: "频数", type: "value" },
    series: [
      {
        name: "直方图",
        type: "bar",
        data: histogramData,
        barWidth: binWidth * 5,
        itemStyle: {
          color: "#B3C0D1"
        }
      },
      {
        name: "拟合曲线",
        type: "line",
        data: x.map((xi, i) => [xi, y[i] * raw.length * binWidth]), // scale to histogram
        lineStyle: { color: "#409EFF" },
        smooth: true,
        symbol: "none"
      }
    ]
  });
};

onMounted(drawChart);
watch(() => props.data, drawChart, { deep: true });
watch(() => props.activeTab, (newVal) => {
  if (newVal === "normal") nextTick(() => chart.value?.resize());
});
</script>
