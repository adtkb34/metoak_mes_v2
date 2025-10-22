<template>
  <div class="p-4">
    <el-select v-model="selectedTable" placeholder="选择数据表" style="width: 200px" @change="fetchData">
      <el-option v-for="table in tables" :key="table.value" :label="table.label" :value="table.value" />
    </el-select>

    <v-chart class="h-[400px] mt-4" :option="chartOption" autoresize />

    <el-alert v-if="error" type="error" :title="error" class="mt-4" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { use } from 'echarts/core';
import VChart from 'vue-echarts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { getProductInfo } from '@/api/home';

use([TitleComponent, TooltipComponent, GridComponent, LegendComponent, MarkLineComponent, CanvasRenderer]);

const tables = [
  { value: 'mo_packing_info', label: '装箱' },
  { value: 'mo_final_check', label: '终检' },
  { value: 'mo_oqc_info', label: 'OQC' },
  { value: 'mo_assemble_info', label: '组装' }
];
const selectedTable = ref(tables[0]);
const hourlyData = ref<number[]>([]);
const error = ref('');

const fetchData = async () => {
  try {
    const result = await getProductInfo(selectedTable.value.value);
    hourlyData.value = result;
    error.value = '';
  } catch (e: any) {
    error.value = e?.message || '获取数据失败';
    hourlyData.value = [];
  }
};


onMounted(fetchData);

const chartOption = computed(() => {
  const avg =
    hourlyData.value.length > 0
      ? Math.round((hourlyData.value.reduce((a, b) => a + b, 0) / hourlyData.value.length) * 100) / 100
      : 0;

  return {

    title: {
      text: `每小时产量`
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}:00`)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '产量',
        type: 'line',
        data: hourlyData.value,
        smooth: true,
        markLine: {
          data: [
            {
              yAxis: avg,
              name: '日平均产量',
              label: {
                formatter: `平均值: ${avg}`
              }
            }
          ]
        }
      }
    ]

  };
});
</script>

<style scoped>
.v-chart {
  width: 100%;
}
</style>
