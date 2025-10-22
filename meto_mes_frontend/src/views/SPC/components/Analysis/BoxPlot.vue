<!-- BoxPlot.vue -->
<template>
  <div ref="chartRef" style="width: 100%; height: 400px" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { quantileSeq } from 'mathjs'

const props = defineProps<{ data: number[] }>()
const chartRef = ref()

const renderChart = () => {
  const sorted = [...props.data].sort((a, b) => a - b)
  const q1 = quantileSeq(sorted, 0.25)
  const q2 = quantileSeq(sorted, 0.5)
  const q3 = quantileSeq(sorted, 0.75)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  const chart = echarts.init(chartRef.value)
  chart.setOption({
    title: { text: '箱型图' },
    tooltip: { trigger: 'item' },
    xAxis: { type: 'category', data: ['数据集'] },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'boxplot',
        type: 'boxplot',
        data: [[min, q1, q2, q3, max]],
      }
    ]
  })
}

onMounted(renderChart)
watch(() => props.data, renderChart)
</script>
