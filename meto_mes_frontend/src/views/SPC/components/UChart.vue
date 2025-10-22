<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed } from 'vue';
import * as echarts from 'echarts';

const props = defineProps<{
  data: { defects: number; unitCount: number }[];
  showControlLines?: boolean;
}>();

const chartDom = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const values = computed(() =>
  props.data.map(d => d.unitCount ? d.defects / d.unitCount : 0)
);

const uAvg = computed(() => {
  const totalDefects = props.data.reduce((sum, d) => sum + d.defects, 0);
  const totalUnits = props.data.reduce((sum, d) => sum + d.unitCount, 0);
  return totalUnits ? totalDefects / totalUnits : 0;
});

function ucl(i: number) {
  const n = props.data[i]?.unitCount || 1;
  return uAvg.value + 3 * Math.sqrt(uAvg.value / n);
}

function lcl(i: number) {
  const n = props.data[i]?.unitCount || 1;
  return Math.max(0, uAvg.value - 3 * Math.sqrt(uAvg.value / n));
}

function renderChart() {
  if (!chartDom.value) return;
  if (!chartInstance) chartInstance = echarts.init(chartDom.value);

  const abnormalSet = new Set<number>();
  values.value.forEach((v, i) => {
    if (v > ucl(i) || v < lcl(i)) abnormalSet.add(i);
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
      }))
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
