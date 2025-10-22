<template>
  <div id="cpk-analysis-chart" class="w-full p-4 bg-white rounded shadow">
    <div v-if="data.length === 0" class="text-gray-400 text-center">暂无数据</div>

    <el-tabs v-else v-model="activeTab" tab-position="top" class="w-full">
      <el-tab-pane
        v-for="(item, index) in data"
        :key="index"
        :label="item.name"
        lazy
      >
        <div ref="chartsRef" :id="`cpk-chart-${index}`" style="width: 100%; height: 300px" />
        <div class="mt-4 text-sm text-gray-600">
          <div>均值（μ）: {{ getMean(item.values).toFixed(3) }}</div>
          <div>标准差（σ）: {{ getStd(item.values).toFixed(3) }}</div>
          <div>CPK: {{ getCpk(item).toFixed(3) }}</div>
          <div>规格下限（LSL）: {{ item.lsl }}</div>
          <div>规格上限（USL）: {{ item.usl }}</div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

interface CpkItem {
  name: string
  values: number[]
  usl: number
  lsl: number
}

const props = defineProps<{
  data: CpkItem[]
}>()

const activeTab = ref<string>('0')
const chartsRef = ref<HTMLElement[]>([])

watch(() => props.data, () => {
  nextTick(() => {
    renderAllCharts()
  })
}, { immediate: true, deep: true })

const renderAllCharts = () => {
  props.data.forEach((item, index) => {
    const dom = document.getElementById(`cpk-chart-${index}`)
    if (!dom) return

    const chart = echarts.init(dom)
    const bins = getHistogramBins(item.values)
    const option = {
      title: { text: item.name + ' 分布图', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: {},
      xAxis: {
        type: 'category',
        data: bins.labels
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '频数',
          type: 'bar',
          data: bins.counts
        },
        {
          name: 'USL/LSL',
          type: 'line',
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'dashed', color: '#f56c6c' },
            label: { formatter: '{b}' },
            data: [
              { xAxis: item.usl, name: 'USL' },
              { xAxis: item.lsl, name: 'LSL' }
            ]
          }
        }
      ]
    }
    chart.setOption(option)
  })
}

// 工具函数
const getMean = (arr: number[]) => arr.reduce((sum, val) => sum + val, 0) / arr.length

const getStd = (arr: number[]) => {
  const mean = getMean(arr)
  const variance = arr.reduce((sum, val) => sum + (val - mean) ** 2, 0) / arr.length
  return Math.sqrt(variance)
}

const getCpk = (item: CpkItem) => {
  const mean = getMean(item.values)
  const std = getStd(item.values)
  const cpu = (item.usl - mean) / (3 * std)
  const cpl = (mean - item.lsl) / (3 * std)
  return Math.min(cpu, cpl)
}

const getHistogramBins = (values: number[]) => {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const binCount = 10
  const step = (max - min) / binCount
  const bins = Array(binCount).fill(0)
  const labels = []

  for (let i = 0; i < binCount; i++) {
    const start = (min + i * step).toFixed(2)
    const end = (min + (i + 1) * step).toFixed(2)
    labels.push(`${start}~${end}`)
  }

  for (const v of values) {
    let index = Math.floor((v - min) / step)
    if (index >= binCount) index = binCount - 1
    bins[index]++
  }

  return { counts: bins, labels }
}
</script>

<style scoped>
#cpk-analysis-chart {
  overflow: auto;
}
</style>
