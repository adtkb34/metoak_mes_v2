<template>
  <div class="p-6 space-y-6">
    <el-card shadow="hover">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="正态分布" name="normal">
          <NormalFit :data="data" :active-tab="activeTab" />
        </el-tab-pane>
        <!-- <el-tab-pane label="统计摘要" name="summary">
          <StatsSummary :data="data" />
        </el-tab-pane> -->
        <!-- <el-tab-pane label="线性回归" name="linear">
          <LinearFit :data="data" :active-tab="activeTab" />
        </el-tab-pane> -->
        <!-- <el-tab-pane label="箱型图" name="box">
          <BoxPlot :data="data" />
        </el-tab-pane> -->

      </el-tabs>
      <template #footer>
        <ExcelUploader @update:data="handleExcelUpdate" />
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

// 拟合分析组件
import NormalFit from './components/Analysis/NormalFit.vue'
import LinearFit from './components/Analysis/LinearFit.vue'
import BoxPlot from './components/Analysis/BoxPlot.vue'
import StatsSummary from './components/Analysis/StatsSummary.vue'

// 导出组件
import ExcelUploader from '@/components/ExcelUploader.vue'


const data = ref([0]);

const activeTab = ref("normal")
function handleExcelUpdate(newData: number[][]) {
  const col = 1;
  data.value = newData
    .map(row => row[col])
    .filter(val => typeof val === "number" && !isNaN(val));
}
</script>
