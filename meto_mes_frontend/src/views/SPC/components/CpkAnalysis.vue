<template>
  <el-card>
    <template #header>
      <div class="flex justify-between items-center">
        <span>CPK 能力分析</span>
        <el-select v-model="selectedColumn" placeholder="选择分析字段" size="small">
          <el-option
            v-for="col in numericColumns"
            :key="col"
            :label="col"
            :value="col"
          />
        </el-select>
      </div>
    </template>

    <div v-if="chartData" class="w-full h-96">
      <v-chart :option="chartOption" autoresize />
    </div>
    <div v-else class="text-gray-400 text-center py-10">请选择字段以进行分析</div>

    <el-descriptions title="统计指标" :column="2" class="mt-4">
      <el-descriptions-item label="样本数">{{ stats.n }}</el-descriptions-item>
      <el-descriptions-item label="平均值">{{ stats.mean.toFixed(2) }}</el-descriptions-item>
      <el-descriptions-item label="标准差">{{ stats.stdDev.toFixed(2) }}</el-descriptions-item>
      <el-descriptions-item label="Cp">{{ stats.cp.toFixed(2) }}</el-descriptions-item>
      <el-descriptions-item label="Cpk">{{ stats.cpk.toFixed(2) }}</el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import VChart from 'vue-echarts';

const props = defineProps<{
  data: Record<string, any>[];
  usl: number;
  lsl: number;
}>();

const selectedColumn = ref('');

const numericColumns = computed(() => {
  if (props.data.length === 0) return [];
  return Object.keys(props.data[0]).filter(key => typeof props.data[0][key] === 'number');
});

const chartData = computed(() => {
  if (!selectedColumn.value) return null;
  return props.data.map(row => row[selectedColumn.value]).filter(v => typeof v === 'number');
});

const stats = computed(() => {
  const values = chartData.value || [];
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1));
  const cp = (props.usl - props.lsl) / (6 * stdDev);
  const cpu = (props.usl - mean) / (3 * stdDev);
  const cpl = (mean - props.lsl) / (3 * stdDev);
  const cpk = Math.min(cpu, cpl);
  return { n, mean, stdDev, cp, cpk };
});

const chartOption = computed(() => {
  if (!chartData.value) return {};
  const bins = 20;
  const values = chartData.value;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (max - min) / bins;
  const histogram: number[] = Array(bins).fill(0);

  values.forEach(v => {
    const index = Math.min(Math.floor((v - min) / step), bins - 1);
    histogram[index]++;
  });

  const xData = histogram.map((_, i) => (min + i * step).toFixed(2));

  return {
    tooltip: {},
    xAxis: { type: 'category', data: xData, name: selectedColumn.value },
    yAxis: { type: 'value' },
    series: [
      {
        name: '频数',
        type: 'bar',
        data: histogram,
        barWidth: '60%',
      },
    ],
    markLine: {
      symbol: 'none',
      data: [
        { xAxis: props.usl, name: 'USL', lineStyle: { color: 'red' } },
        { xAxis: props.lsl, name: 'LSL', lineStyle: { color: 'blue' } },
      ],
    },
  };
});
</script>

<style scoped>
.v-chart {
  height: 100%;
}
</style>
