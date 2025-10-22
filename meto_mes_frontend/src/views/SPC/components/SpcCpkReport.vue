<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  data: number[];
  usl: number;
  lsl: number;
}>();

const mean = computed(() => props.data.reduce((a, b) => a + b, 0) / props.data.length);
const std = computed(() => {
  const m = mean.value;
  return Math.sqrt(props.data.reduce((s, v) => s + Math.pow(v - m, 2), 0) / (props.data.length - 1));
});
const cpk = computed(() => {
  const cpu = (props.usl - mean.value) / (3 * std.value);
  const cpl = (mean.value - props.lsl) / (3 * std.value);
  return Math.min(cpu, cpl);
});
</script>

<template>
  <el-descriptions title="CPK 分析报告" :column="2" border>
    <el-descriptions-item label="数据量">{{ data.length }}</el-descriptions-item>
    <el-descriptions-item label="均值">{{ mean.toFixed(3) }}</el-descriptions-item>
    <el-descriptions-item label="标准差">{{ std.toFixed(3) }}</el-descriptions-item>
    <el-descriptions-item label="CPK">{{ cpk.toFixed(3) }}</el-descriptions-item>
  </el-descriptions>
</template>
