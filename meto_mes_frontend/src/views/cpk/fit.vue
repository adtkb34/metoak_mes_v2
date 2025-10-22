<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import * as echarts from "echarts";
import { create, all } from "mathjs";

const math= create(all);

const rawData = ref<number[]>([
  54.35, 60.29, 28.9, 40.64, 60.42, 47.45, 39.21, 28.13, 44.49, 46.7, 55.52,
  53.5, 39.65, 51.92, 49.91, 37.79, 57.72, 41.25, 58.83, 44.59, 47.65, 66.45,
  53.7, 74.22, 33.97, 41.09, 54.5, 56.98, 49.84, 65.5, 44.33, 45.35, 57.23,
  59.57, 59.31
]);

const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts;

const fitType = ref<"normal" | "kde" | "gradient">("normal");

function calcHistogram(data: number[], binCount = 20) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binSize = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    x: min + i * binSize,
    count: 0
  }));

  for (const val of data) {
    const index = Math.min(Math.floor((val - min) / binSize), binCount - 1);
    bins[index].count++;
  }

  return bins;
}

function normalPdf(x: number, mean: number, std: number): number {
  const factor = 1 / (std * Math.sqrt(2 * Math.PI));
  const exponent = -0.5 * ((x - mean) / std) ** 2;
  return factor * Math.exp(exponent);
}

function renderChart() {
  const data = rawData.value;
  if (!data.length || !chartRef.value) return;

  const bins = calcHistogram(data);
  const binCenters = bins.map(b => b.x);
  const histogramData = bins.map(b => b.count);

  const mean = math.mean(data) as number;
  let _std = math.std(data)
  const std = Array.isArray(_std) ? (_std[0] as number)
    : (_std as number);

  const fitX = math.range(Math.min(...data), Math.max(...data), 0.1).toArray() as number[];
  let fitY: number[] = [];

  if (fitType.value === "normal") {
    fitY = fitX.map(x => normalPdf(x, mean, std) * data.length);
  } else if (fitType.value === "kde") {
    fitY = fitX.map(x => {
      const kernelSum = data.reduce((acc, xi) => {
        const h = std;
        const u = (x - xi) / h;
        return acc + Math.exp(-0.5 * u ** 2);
      }, 0);
      return kernelSum / (data.length * std * Math.sqrt(2 * Math.PI));
    }).map(y => y * data.length);
  } else if (fitType.value === "gradient") {
    const a = -0.01, b = 0.5, c = -2, d = 40;
    fitY = fitX.map(x => a * x ** 3 + b * x ** 2 + c * x + d);
  }

  chart.setOption({
    title: { text: `数据分布 + 拟合（${fitType.value}）`, left: "center" },
    tooltip: {},
    xAxis: { type: "value", name: "数值" },
    yAxis: { type: "value", name: "频数" },
    series: [
      {
        type: "bar",
        name: "频数",
        data: binCenters.map((x, i) => [x, histogramData[i]]),
        barWidth: "90%"
      },
      {
        type: "line",
        name: "拟合",
        data: fitX.map((x, i) => [x, fitY[i]]),
        lineStyle: { color: "#FF5722", width: 2 },
        showSymbol: false,
        smooth: true
      }
    ]
  });
}

watch(fitType, renderChart);

onMounted(() => {
  if (!chartRef.value) return;
  chart = echarts.init(chartRef.value);
  renderChart();
});
</script>

<template>
  <div>
    <div style="margin-bottom: 8px">
      <label>拟合类型：</label>
      <select v-model="fitType">
        <option value="normal">正态分布</option>
        <option value="kde">核密度估计</option>
        <option value="gradient">梯度下降拟合</option>
      </select>
    </div>
    <div ref="chartRef" style="height: 600px; width: 100%" />
  </div>
</template>