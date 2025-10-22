<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed } from 'vue';
import * as echarts from 'echarts';

const props = defineProps<{
  data: { defective: number; sampleSize: number }[];
  showControlLines?: boolean;
}>();

const chartDom = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const values = computed(() => props.data.map(d => d.defective));
const n = computed(() => props.data[0]?.sampleSize || 1);
const avg = computed(() => values.value.reduce((a, b) => a + b, 0) / values.value.length);
const p = computed(() => avg.value / n.value);
const ucl = computed(() => n.value * (p.value + 3 * Math.sqrt((p.value * (1 - p.value)) / n.value)));
const lcl = computed(() => Math.max(0, n.value * (p.value - 3 * Math.sqrt((p.value * (1 - p.value)) / n.value))));

function renderChart() {
  if (!chartDom.value) return;
  if (!chartInstance) chartInstance = echarts.init(chartDom.value);

  const abnormalSet = new Set<number>();
  values.value.forEach((v, i) => {
    if (v > ucl.value || v < lcl.value) abnormalSet.add(i);
  });

  chartInstance.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: values.value.map((_, i) => i + 1) },
    yAxis: { type: 'value' },
    series: [{
      type: 'line',
      data: values.value.map((v, i) => ({
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
