<!-- LinearFit.vue -->
<template>
  <div ref="chartRef" style="height: 400px; width: 100%"></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { fitLinear } from '../../utils/fit';

const props = defineProps<{
  data: number[]
  activeTab: string
}>()

const chartRef = ref<HTMLDivElement | null>(null)
const chart = ref<echarts.ECharts | null>(null)

const drawChart = () => {
  if (!chartRef.value) return
  if (!chart.value) chart.value = echarts.init(chartRef.value)

  const { x, y, a, b, predicted } = fitLinear(props.data);


  chart.value.setOption({
    title: {
      text: `线性回归：y = ${a.toFixed(2)} + ${b.toFixed(2)}x`,
      left: 'center'
    },
    tooltip: { trigger: 'axis' },
    xAxis: { name: '样本序号', type: 'value' },
    yAxis: { name: '值', type: 'value' },
    series: [
      {
        name: '原始值',
        type: 'scatter',
        data: x.map((xi, i) => [xi, y[i]]),
        emphasis: { focus: 'series' }
      },
      {
        name: '拟合线',
        type: 'line',
        data: x.map((xi, i) => [xi, predicted[i]]),
        lineStyle: { color: '#409EFF' },
        symbol: 'none'
      }
    ]
  })
}

const tryResize = () => {
  nextTick(() => {
    if (chart.value) {
      chart.value.resize()
    }
  })
}

// 初始化
onMounted(() => {
  if (props.activeTab === 'linear') {
    drawChart()
  }
})

// 当 tab 激活变化时重绘/resize
watch(() => props.activeTab, (newVal) => {
  if (newVal === "linear") tryResize();
})

// 数据变化时重绘
watch(() => props.data, () => {
  if (props.activeTab === 'linear') {
    drawChart()
  }
}, { deep: true })
</script>
