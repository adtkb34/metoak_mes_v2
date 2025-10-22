<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue';
import * as echarts from 'echarts';

const props = defineProps<{
  defectiveCounts: number[];  // 每组不良数
  sampleSizes: number[];      // 每组样本数
  showControlLines?: boolean;
}>();

const chartDom = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

// 比例数据
const proportions = computed(() =>
  props.defectiveCounts.map((v, i) => v / props.sampleSizes[i])
);

// 平均不合格率
const avgP = computed(() => {
  const totalDefect = props.defectiveCounts.reduce((a, b) => a + b, 0);
  const totalN = props.sampleSizes.reduce((a, b) => a + b, 0);
  return totalDefect / totalN;
});

// 控制线
const controlLimits = computed(() =>
  props.sampleSizes.map(n => {
    const std = Math.sqrt(avgP.value * (1 - avgP.value) / n);
    return {
      ucl: Math.min(1, avgP.value + 3 * std),
      lcl: Math.max(0, avgP.value - 3 * std),
    };
  })
);

function renderChart() {
  if (!chartDom.value) return;
  if (!chartInstance) chartInstance = echarts.init(chartDom.value);

  const seriesData = proportions.value.map((p, i) => ({
    value: p,
    itemStyle: {
      color: p > controlLimits.value[i].ucl || p < controlLimits.value[i].lcl ? 'red' : '#409EFF',
    }
  }));

  chartInstance.setOption({
    animation: false,
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: proportions.value.map((_, i) => i + 1),
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
    },
    series: [
      {
        name: '不良率',
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: '#409EFF' },
        data: seriesData,
      },
      ...(props.showControlLines !== false
        ? [
            {
              type: 'line',
              name: '中心线',
              markLine: {
                silent: true,
                symbol: 'none',
                lineStyle: { type: 'dashed', color: 'gray' },
                label: {
                  show: true,
                  formatter: `CL: ${(avgP.value * 100).toFixed(2)}%`,
                  color: '#000',
                },
                data: [{ yAxis: avgP.value }],
              },
            },
          ]
        : []),
    ],
  });
  chartInstance.resize();
}

watch(() => [props.defectiveCounts, props.sampleSizes, props.showControlLines], renderChart, {
  deep: true,
});

onMounted(() => {
  nextTick(() => {
    if (chartDom.value) {
      chartInstance = echarts.init(chartDom.value);
      renderChart();
      resizeObserver = new ResizeObserver(() => {
        chartInstance?.resize();
      });
      resizeObserver.observe(chartDom.value);
    }
  });
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  chartInstance?.dispose();
});
</script>

<template>
  <div style="display: flex; flex-direction: column; height: 100%">
    <div ref="chartDom" style="flex: 1; width: 100%; min-height: 300px" />
  </div>
</template>
