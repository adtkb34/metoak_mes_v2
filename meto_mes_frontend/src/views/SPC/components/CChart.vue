<!-- Components/CCChart.vue -->
<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed } from 'vue';
import * as echarts from 'echarts';

const props = defineProps<{
  data: number[];
  showControlLines?: boolean;
}>();

const chartDom = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const avg = computed(() => props.data.reduce((a, b) => a + b, 0) / props.data.length);
const ucl = computed(() => avg.value + 3 * Math.sqrt(avg.value));
const lcl = computed(() => Math.max(0, avg.value - 3 * Math.sqrt(avg.value)));

function renderChart() {
  if (!chartDom.value) return;
  if (!chartInstance) chartInstance = echarts.init(chartDom.value);

  const abnormalSet = new Set<number>();
  props.data.forEach((v, i) => {
    if (v > ucl.value || v < lcl.value) abnormalSet.add(i);
  });

  chartInstance.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: props.data.map((_, i) => i + 1) },
    yAxis: { type: 'value' },
    series: [{
      type: 'line',
      data: props.data.map((v, i) => ({
        value: v,
        itemStyle: { color: abnormalSet.has(i) ? 'red' : '#409EFF' }
      })),
      markLine: props.showControlLines !== false ? {
        symbol: 'none',
        label: {
          show: true,
          formatter: p => `${p.name}: ${p.value.toFixed(2)}`,
          color: '#000'
        },
        lineStyle: { type: 'dashed' },
        data: [
          { yAxis: lcl.value, name: 'LCL' },
          { yAxis: ucl.value, name: 'UCL' },
          { yAxis: avg.value, name: '均值' }
        ]
      } : undefined
    }]
  });
  chartInstance.resize();
}

watch(() => props.data, renderChart, { deep: true });
onMounted(() => nextTick(renderChart));
</script>

<template>
  <div style="height: 300px; width: 100%;" ref="chartDom" />
</template>
