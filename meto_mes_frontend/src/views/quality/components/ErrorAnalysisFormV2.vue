<template>
  <div class="overflow-auto">
    <el-table
      :data="processedData"
      border
      style="width: 100%">
      <el-table-column prop="step" label="工序名" width="180" />
      <el-table-column prop="total" label="总数" width="100" />
      <el-table-column prop="pass" label="合格数" width="100" />
      <el-table-column prop="fail" label="不良数" width="100" />
      <el-table-column prop="rate" label="合格率" width="100" />
    </el-table>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

// 数据加工：计算合格数、不良数、总数、合格率
const processedData = computed(() => {
  return props.data.map(item => {
    const total = item.data.totalGroups || 0
    let pass = 0
    let fail = 0
    if (Array.isArray(item.data.stats)) {
      item.data.stats.forEach(stat => {
        if (stat.error_code === '0') {
          pass += stat.count
        } else {
          fail += stat.count
        }
      })
    }
    const rate = total ? ((pass / total) * 100).toFixed(1) + '%' : '0%'
    return {
      step: item.step,
      total,
      pass,
      fail,
      rate
    }
  })
})
</script>
