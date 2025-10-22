<template>
  <div class="chart-page">
    <!-- 筛选条件 -->
    <div class="filter-bar">
      <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至"
        start-placeholder="开始日期" end-placeholder="结束日期" style="width: 800px;" />
      <el-select v-model="distance" placeholder="选择测试距离（M）" allow-create filterable>
        <el-option v-for="item in distanceOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="selectedPrecisions" multiple placeholder="选择精度（%）" allow-create filterable>
        <el-option v-for="item in precisionOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button type="primary" @click="fetchData">查询</el-button>
    </div>

    <!-- 组合图表 -->
    <div ref="chartRef" style="width: 100%; height: 500px;"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { getMeasureDistanceData } from '@/api/quality' // 你的接口

const dateRange = ref([])
const distance = ref()
const selectedPrecisions = ref([])
const distanceOptions = [
  { label: '2', value: 2 },
  { label: '5', value: 5 },
  { label: '8', value: 8 }
]
const precisionOptions = [
  { label: '1', value: 1 },
  { label: '1.5', value: 1.5 },
  { label: '2', value: 2 }
]

const chartRef = ref(null)
let chartInstance = null

const initChart = () => {
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: []
    },
    xAxis: {
      type: 'category',
      data: []
    },
    yAxis: [
      {
        type: 'value',
        name: '百分比',
        min: 0,
        max: 100,
        position: 'left',
        axisLabel: {
          formatter: '{value} %'
        }
      },
      {
        type: 'value',
        name: '数量',
        position: 'right',
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: []
  })
}

const fetchData = async () => {
  if (!dateRange.value.length || !selectedPrecisions.value.length || !distance.value) {
    ElMessage.warning('请选择日期范围和精度')
    return
  }

  const params = {
    startDate: dateRange.value[0],
    endDate: dateRange.value[1],
    distance: distance.value * 1000,
    precisions: selectedPrecisions.value.join(',')
  }

  try {
    const res = await getMeasureDistanceData(params)
    const data = res

    // 更新图表
    chartInstance.setOption({
      legend: {
        data: [...data.series.map(s => s.name), '数量']
      },
      xAxis: {
        data: data.dates
      },
      series: [
        // 折线
        ...data.series.map(s => ({
          name: s.name,
          type: 'line',
          data: s.data,
          smooth: true,
          yAxisIndex: 0
        })),
        // 柱状图
        {
          name: '数量',
          type: 'bar',
          data: data.counts,
          yAxisIndex: 1,
          itemStyle: {
            color: '#73c0de'
          },
          barWidth: '40%'
        }
      ]
    })
  } catch (error) {
    ElMessage.error('获取数据失败')
    console.error(error)
  }
}

onMounted(() => {
  initChart()
})
</script>

<style scoped>
.chart-page {
  padding: 16px;
}

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
}
</style>
