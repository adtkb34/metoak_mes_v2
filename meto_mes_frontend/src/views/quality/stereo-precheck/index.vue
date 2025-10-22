<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { http } from "@/utils/http";

const query = ref({
  page: 1,
  pageSize: 10,
  startDate: undefined,
  endDate: undefined,
  isPrecheck: 1 // 默认性能检
});

const tableData = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);

// 自动化表头
const columns = ref<string[]>([]);

// 获取数据
async function fetchData() {
  loading.value = true;
  try {
    const res = await http.request("get", "/stereo-precheck/page", {
      params: query.value
    });
    
    if (res) {
      total.value = res.total;
      tableData.value = res.records;

      if (tableData.value.length > 0) {
        columns.value = Object.keys(tableData.value[0]);
      }
    }
  } catch (e) {
    ElMessage.error("查询失败");
    console.error(e);
  } finally {
    loading.value = false;
  }
}

// 导出 CSV（全量数据）
async function exportCSV() {
  ElMessage.info("正在导出，请稍候...");
  let allData: any[] = [];
  let page = 1;
  const pageSize = 500;

  while (true) {
    const res = await http.request("get", "/stereo-precheck/page", {
      params: { ...query.value, page, pageSize }
    });
    const records = res.records ?? [];
    allData = allData.concat(records);
    if (records.length < pageSize) break;
    page++;
  }

  if (!allData.length) {
    ElMessage.warning("没有数据可导出");
    return;
  }

  const headers = Object.keys(allData[0]);
  const csvRows: string[] = [];
  csvRows.push(headers.join(","));
  allData.forEach(row => {
    csvRows.push(headers.map(h => JSON.stringify(row[h] ?? "")).join(","));
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `stereo_precheck_${query.value.startDate || "all"}_${Date.now()}.csv`;
  link.click();
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <el-card class="p-4">
    <!-- 筛选条件 -->
    <el-form :inline="true" class="mb-4">
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="query.startDate"
          type="datetime"
          placeholder="开始时间"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
        <span style="margin: 0 8px">至</span>
        <el-date-picker
          v-model="query.endDate"
          type="datetime"
          placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item label="检测类型">
        <el-select v-model="query.isPrecheck" placeholder="请选择" style="width: 160px;">
          <el-option label="性能检" :value="1" />
          <el-option label="出货检" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchData">查询数据</el-button>
        <el-button @click="exportCSV">导出 CSV</el-button>
      </el-form-item>
    </el-form>

    <!-- 动态表格 -->
    <el-table :data="tableData" border style="width: 100%" v-loading="loading">
      <el-table-column
        v-for="col in columns"
        :key="col"
        :prop="col"
        :label="col"
        min-width="120"
        show-overflow-tooltip
      />
    </el-table>

    <!-- 分页器 -->
    <div class="flex justify-center mt-4">
      <el-pagination
        background
        layout="prev, pager, next, jumper, total"
        :total="total"
        :page-size="query.pageSize"
        v-model:current-page="query.page"
        @current-change="fetchData"
      />
    </div>
  </el-card>
</template>
