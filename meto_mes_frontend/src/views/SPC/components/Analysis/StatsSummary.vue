<!-- StatsSummary.vue -->
<template>
  <el-descriptions title="统计摘要" :column="2" border>
    <el-descriptions-item label="均值">{{ formatNumber(mu) }}</el-descriptions-item>
    <!-- <el-descriptions-item label="标准差">{{ formatNumber(sigma) }}</el-descriptions-item> -->
    <el-descriptions-item label="最小值">{{ formatNumber(min) }}</el-descriptions-item>
    <el-descriptions-item label="最大值">{{ formatNumber(max) }}</el-descriptions-item>
    <el-descriptions-item label="NG 数量">{{ ng ? (ng) : 0 }}</el-descriptions-item>
  </el-descriptions>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { mean, std, min as mathMin, max as mathMax } from 'mathjs'

const props = defineProps<{ data: number[], ng: number[] | undefined }>()

const safeCalc = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn()
  } catch {
    return fallback
  }
}

const mu = computed(() => props.data.length ? safeCalc(() => mean(props.data), 0) : 0)
const sigma = computed(() => props.data.length ? safeCalc(() => std(props.data), 0) : 0)
const min = computed(() => props.data.length ? safeCalc(() => mathMin(props.data), 0) : 0)
const max = computed(() => props.data.length ? safeCalc(() => mathMax(props.data), 0) : 0)

function formatNumber(val: number) {
  return Number.isFinite(val) ? val.toFixed(2) : '-'
}
</script>
