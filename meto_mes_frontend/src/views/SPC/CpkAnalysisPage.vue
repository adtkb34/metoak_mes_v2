<template>
  <div class="p-6 space-y-4">
    <el-card>
      <template #header>
        <div class="text-xl font-bold">CPK 分析报告</div>
      </template>

      <!-- 参数选择区域（可选） -->
      <el-form :inline="true" :model="filters" class="mb-4">
        <el-form-item label="选择产品">
          <el-select v-model="filters.product" placeholder="请选择产品" style="width: 200px">
            <el-option label="产品A" value="productA" />
            <el-option label="产品B" value="productB" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
            end-placeholder="结束日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 分析组件 -->
      <CpkAnalysis :usl="50" :lsl="30" :data="cpkData" />

      <template #footer>
        <!-- 导出按钮 -->
        <div class="flex gap-4 mt-4">
          <!-- <ExcelExporter :data="cpkData" file-name="CPK分析.xlsx" />
      <PdfExporter :dom-id="'cpk-analysis-chart'" file-name="CPK分析.pdf" /> -->
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CpkAnalysisTest from "./components/CpkAnalysisTest.vue";
import CpkAnalysis from "./components/CpkAnalysis.vue";

// 假设的数据结构
const cpkData = ref([
  {
    name: "尺寸1",
    values: [10.2, 10.5, 10.4, 10.1, 10.3, 10.2],
    usl: 10.8,
    lsl: 9.8
  },
  {
    name: "尺寸2",
    values: [5.1, 5.0, 5.2, 5.1, 5.1, 5.3],
    usl: 5.5,
    lsl: 4.5
  }
]);

// 查询条件
const filters = ref({
  product: "",
  dateRange: []
});

const loadData = () => {
  // TODO: 根据 filters 查询实际数据并设置到 cpkData
  console.log("查询数据: ", filters.value);
};
</script>
