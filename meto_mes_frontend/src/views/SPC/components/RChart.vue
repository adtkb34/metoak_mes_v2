<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, toRefs, computed } from 'vue';
import * as echarts from 'echarts';

const props = defineProps<{
  data: number[][];
  showControlLines?: boolean;
  subgroupSize?: number;
}>();

const { showControlLines } = toRefs(props);
const chartDom = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

// 计算极差数据和统计参数
const ranges = computed(() => props.data.map(group => Math.max(...group) - Math.min(...group)));
const avgRange = computed(() => ranges.value.reduce((a, b) => a + b, 0) / ranges.value.length);
const d2 = 2.223; // 常用d2因子（n=5）

const ucl = computed(() => avgRange.value * 2.114); // A2 * R-bar
const lcl = computed(() => Math.max(0, avgRange.value * 0)); // LCL不小于0，R图常为0

function renderChart() {
  if (!chartDom.value) return;
  if (!chartInstance) chartInstance = echarts.init(chartDom.value);

  const mainSeries = {
    name: '极差值',
    type: 'line',
    smooth: false,
    symbol: 'circle',
    symbolSize: 3,
    lineStyle: { color: '#67C23A' },
    data: ranges.value,
    markLine: props.showControlLines !== false ? {
      symbol: 'none',
      label: {
        show: true,
        position: 'end',
        formatter: p => `${p.name}: ${p.value.toFixed(2)}`,
        color: '#000'
      },
      lineStyle: { type: 'dashed', color: 'gray' },
      data: [
        { yAxis: avgRange.value, name: '均值', lineStyle: { color: '#FFA500' } },
        { yAxis: ucl.value, name: 'UCL', lineStyle: { color: 'purple' } },
        { yAxis: lcl.value, name: 'LCL', lineStyle: { color: 'purple' } }
      ]
    } : undefined
  };

  chartInstance.setOption({
    animation: false,
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ranges.value.map((_, i) => i + 1),
      boundaryGap: false
    },
    yAxis: {
      type: 'value'
    },
    series: [mainSeries]
  }, true);

  chartInstance.resize();
}

watch(() => props.data, () => {
  renderChart();
}, { deep: true });

watch(() => showControlLines?.value, () => {
  renderChart();
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
  <div style="display: flex; flex-direction: column; height: 100%;">
    <div ref="chartDom" style="flex: 1; width: 100%; min-height: 300px;" />
  </div>
</template>
