<!-- StatsSummary.vue -->
<template>
  <el-descriptions title="统计摘要" :column="2" border>
    <el-descriptions-item label="均值">{{ mu.toFixed(2) }}</el-descriptions-item>
    <el-descriptions-item label="标准差">{{ Number(sigma).toFixed(2) }}</el-descriptions-item>
    <el-descriptions-item label="最小值">{{ min }}</el-descriptions-item>
    <el-descriptions-item label="最大值">{{ max }}</el-descriptions-item>
  </el-descriptions>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { mean, std, min as mathMin, max as mathMax } from 'mathjs'

const props = defineProps<{ data: number[] }>()

const mu = computed(() => mean(props.data))
const sigma = computed(() => std(props.data))
const min = computed(() => mathMin(props.data))
const max = computed(() => mathMax(props.data))
</script>
