<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, toRefs } from 'vue';
import * as echarts from 'echarts';
import { fitNormal } from '../utils/fit';
import {
  detectRule1, detectRule2, detectRule3, detectRule4,
  detectRule5, detectRule6, detectRule7, detectRule8
} from '../utils/detectRules';

const props = defineProps<{
  data: number[];
  showControlLines?: boolean;
  rules: string[];
  usl?: number;
  lsl?: number;
}>();

const { showControlLines, rules, usl, lsl } = toRefs(props);

const chartDom = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const avg = ref(0);
const lcl = ref(0);
const ucl = ref(0);
let std = 0;

function updateParams() {
  const arr = props.data.length === 0 ? [0] : props.data;
  const { mean: m, std: s } = fitNormal(arr);
  std = s > 1e-8 ? s : 0.01;
  avg.value = m;
  lcl.value = m - 3 * s;
  ucl.value = m + 3 * s;
}

const ruleOptions = [
  { label: '1点超 USL/LSL', value: 'rule_1' },
  { label: '连续6点上升/下降', value: 'rule_2' },
  { label: '连续9点在均值一侧', value: 'rule_3' },
  { label: '连续14点交替升降', value: 'rule_4' },
  { label: '连续2点中有1点超±2σ', value: 'rule_5' },
  { label: '连续3点中2点超±1σ', value: 'rule_6' },
  { label: '连续15点落在±1σ以内', value: 'rule_7' },
  { label: '连续8点落在±1σ以外', value: 'rule_8' },
];

function renderChart() {
  if (!chartDom.value) return;
  if (!chartInstance) chartInstance = echarts.init(chartDom.value);

  if (!props.data || props.data.length === 0) {
    chartInstance.clear();
    chartInstance.setOption({
      title: { text: '暂无数据', left: 'center', top: 'middle' },
    });
    return;
  }

  updateParams();

  const curUSL = usl?.value ?? ucl.value + std;
  const curLSL = lsl?.value ?? lcl.value - 0.5 * std;

  // 计算异常点
  const ruleAbnormals: Record<string, number[]> = {};
  const allAbnormalSet = new Set<number>();

  for (const ruleName of props.rules) {
    let res: number[] = [];
    switch (ruleName) {
      case 'rule_1': res = detectRule1(props.data, curUSL, curLSL); break;
      case 'rule_2': res = detectRule2(props.data); break;
      case 'rule_3': res = detectRule3(props.data, avg.value); break;
      case 'rule_4': res = detectRule4(props.data); break;
      case 'rule_5': res = detectRule5(props.data, avg.value, std); break;
      case 'rule_6': res = detectRule6(props.data, avg.value, std); break;
      case 'rule_7': res = detectRule7(props.data, avg.value, std); break;
      case 'rule_8': res = detectRule8(props.data, avg.value, std); break;
    }
    ruleAbnormals[ruleName] = res;
    res.forEach(i => allAbnormalSet.add(i));
  }

  // 主折线
  const mainSeries = {
    name: '值',
    type: 'line',
    smooth: false,
    symbol: 'circle',
    symbolSize: 3,
    lineStyle: { color: '#409EFF' },
    data: props.data.map((v, i) => ({
      value: v,
      itemStyle: { color: allAbnormalSet.has(i) ? 'red' : '#409EFF' },
    })),
    markLine: showControlLines.value ? {
      symbol: 'none',
      label: { show: true, position: 'end', formatter: p => `${p.name}: ${p.value.toFixed(2)}` },
      lineStyle: { type: 'dashed', color: 'gray' },
      data: [
        { yAxis: curUSL, name: 'USL', lineStyle: { color: 'red' } },
        { yAxis: curLSL, name: 'LSL', lineStyle: { color: 'green' } },
        { yAxis: avg.value, name: '均值', lineStyle: { color: '#FFA500' } },
        { yAxis: ucl.value, name: 'UCL', lineStyle: { color: 'purple' } },
        { yAxis: lcl.value, name: 'LCL', lineStyle: { color: 'purple' } },
      ],
    } : undefined,
  };

  // 异常点散点堆叠
  const scatterSeries = props.rules.map((rule, idx) => {
    const label = ruleOptions.find(r => r.value === rule)?.label || rule;
    const yBase = lcl.value - (idx + 10) * 0.2 * std; // 堆叠向下
    return {
      name: label,
      type: 'scatter',
      symbol: 'circle',
      symbolSize: 5,
      itemStyle: { color: ['#f56c6c', '#e6a23c', '#67c23a', '#409EFF'][idx % 4] },
      data: ruleAbnormals[rule].map(i => [i, yBase]),
      label: { show: true, position: 'top', formatter: () => rule.replace('rule_', 'R'), fontSize: 10 },
      labelLayout: { hideOverlap: true, moveOverlap: true },
      tooltip: { formatter: p => `${label} 异常：第 ${p.data[0]} 个` },
    };
  });

  // 动态 y 轴范围
  const dataMin = Math.min(...props.data);
  const dataMax = Math.max(...props.data);
  const scatterYs = scatterSeries.flatMap(s => s.data.map(d => d[1]));
  // const yMin = Math.min(dataMin, ...scatterYs, curLSL, lcl.value);
  // const yMax = Math.max(dataMax, ...scatterYs, curUSL, ucl.value);
  const yMin = Math.min(dataMin, ...scatterYs, lcl.value);
  const yMax = Math.max(dataMax, ...scatterYs, ucl.value);

  const margin = Math.max((yMax - yMin) * 0.2, 0.05);
  const round2 = (v: number) => Math.round(v * 100) / 100;

  chartInstance.setOption({
    animation: false,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: props.data.map((_, i) => i + 1), boundaryGap: false },
    yAxis: { type: 'value', min: round2(yMin - margin), max: round2(yMax + margin) },
    series: [mainSeries, ...scatterSeries],
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, zoomOnMouseWheel: true, moveOnMouseMove: true, moveOnMouseWheel: true },
      { type: 'slider', xAxisIndex: 0, height: 20, bottom: 0 }
    ],
  }, { notMerge: true });

  chartInstance.resize();
}

watch(() => props.data, () => renderChart(), { deep: true });
watch([showControlLines, rules, usl, lsl], () => renderChart(), { deep: true });

onMounted(() => {
  nextTick(() => {
    if (chartDom.value) {
      chartInstance = echarts.init(chartDom.value);
      renderChart();
      resizeObserver = new ResizeObserver(() => chartInstance?.resize());
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
  <div ref="chartDom" style="width: 100%; height: 300px;" />
</template>
