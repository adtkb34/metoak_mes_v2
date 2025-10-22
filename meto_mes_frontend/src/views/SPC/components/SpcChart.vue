<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed, toRef, toRefs } from 'vue';
import * as echarts from 'echarts';
import { fitNormal } from '../utils/fit';
import {
  detectRule1, detectRule2, detectRule3, detectRule4,
  detectRule5, detectRule6, detectRule7, detectRule8
} from '../utils/detectRules';
import { useSpcStore } from '@/store/modules/SPC/v1';
import { useSpcStorev2 } from '@/store/modules/SPC/v2';

const props = defineProps<{
  data: number[];
  showControlLines?: boolean;
  rules: string[]
}>();

const spc = useSpcStorev2();

const { showControlLines, rules } = toRefs(props);

const chartDom = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const avg = ref(0);
const lcl = ref(0);
const ucl = ref(0);
let std = 0;

function updateParams() {
  const { mean: m, std: s } = fitNormal(props.data);
  std = s > 1e-8 ? s : 0.01;
  avg.value = m;
  lcl.value = m - 3 * s;
  ucl.value = m + 3 * s;
  // spc.lsl = lcl.value - 0.5 * std;
  // spc.usl = ucl.value + std;
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

  updateParams();

  // 每个规则对应的异常点索引
  const ruleAbnormals: Record<string, number[]> = {};
  const allAbnormalSet = new Set<number>();

  for (const ruleName of props.rules) {
    let res: number[] = [];
    switch (ruleName) {
      case 'rule_1': res = detectRule1(props.data, spc.usl, spc.lsl); break;
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

  const mainSeries = {
    name: '值',
    type: 'line',
    smooth: false,
    symbol: 'circle',
    symbolSize: 3,
    lineStyle: { color: '#409EFF' },
    data: props.data.map((v, i) => ({
      value: v,
      itemStyle: {
        color: allAbnormalSet.has(i) ? 'red' : '#409EFF'
      }
    })),
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
        { yAxis: spc.usl, name: 'USL', lineStyle: { color: 'red' } },
        { yAxis: spc.lsl, name: 'LSL', lineStyle: { color: 'green' } },
        { yAxis: avg.value, name: '均值', lineStyle: { color: '#FFA500' } },
        { yAxis: ucl.value, name: 'UCL', lineStyle: { color: 'purple' } },
        { yAxis: lcl.value, name: 'LCL', lineStyle: { color: 'purple' } }
      ]
    } : undefined
  };

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
      label: {
        show: true,
        position: 'top',
        formatter: () => rule.replace('rule_', 'R'),
        fontSize: 10
      },
      labelLayout: {
        hideOverlap: true,
        moveOverlap: true
      },
      tooltip: {
        formatter: p => `${label} 异常：第 ${p.data[0]} 个`
      },
    };
  });

  // 添加round函数
  const round2 = (v: number) => Math.round(v * 100) / 100;

  const dataMin = Math.min(...props.data);
  const dataMax = Math.max(...props.data);
  const scatterMinY = Math.min(...scatterSeries.flatMap(s => s.data.map(d => d[1])));
  const yMin = Math.min(dataMin, scatterMinY);
  const yMax = Math.max(dataMax, ucl.value);

  // 避免堆叠时 yRange 为 0
  const trueRange = yMax - yMin;
  const minVisualRange = 1; // 至少拉开 1 的纵向跨度
  const margin = Math.max((trueRange * 0.2), (minVisualRange - trueRange) / 2, 0.05);

  const finalMin = round2(yMin - margin);
  const finalMax = round2(yMax + margin);

  chartInstance.setOption({
    animation: false,
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: props.data.map((_, i) => i + 1),
      boundaryGap: false,
    },
    series: [mainSeries, ...scatterSeries],
    yAxis: {
      type: 'value',
      min: finalMin,
      max: finalMax,
    },
    dataZoom: [
      {
        type: 'inside', // 鼠标滚轮缩放
        xAxisIndex: 0,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: true
      },
      {
        type: 'slider', // 底部缩放条
        xAxisIndex: 0,
        height: 20,
        bottom: 0
      }
    ],
  }, true); // 第二个参数为 true 表示“重置”option，防止堆叠残留

  chartInstance.resize();
}

watch([
  () => spc.usl,
  () => spc.lsl,
  () => showControlLines,
  () => rules
], () => {
  console.log(spc.usl, spc.lsl);
  
  updateParams();
  renderChart();
});

watch(() => props.data, () => {
  updateParams();
  renderChart();
}, { deep: true });

onMounted(() => {
  updateParams();
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
  <div style=" display: flex; flex-direction: column; height: 100%;">
    <!-- 图表区域：高度由父容器控制 -->
    <div ref="chartDom" style="flex: 1; width: 100%; min-height: 300px;" />
  </div>
</template>
