<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { http } from "@/utils/http";
import dayjs from 'dayjs'

const query = ref({
  page: 1,
  pageSize: 10,
  startDate: undefined,
  endDate: undefined,
  isPrecheck: 1 // 默认性能检
});

const allData = ref<any[]>([]);
const tableData = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);

// 自动化表头
const columns = ref<string[]>([]);

// 在文件顶部或配置处定义旧的列顺序（按需修改）
const EXPECTED_COLUMNS: string[] = [
  "sn",
  "datetime",
  "error_code",
  "lo_mean",
  "clarity_left",
  "clarity_right",
  "station",
  // "oldField1",    // 以前存在、现在被后端去掉的字段
  // "oldField2"
];

const usePadColumns = ref(true); // 控制是否补齐（可在 UI 暴露开关）


async function fetchData() {
  loading.value = true;
  try {
    const res = await http.request("get", "/stereo-precheck/page", {
      params: {
        startDate: query.value.startDate,
        endDate: query.value.endDate,
        page: 1,
        pageSize: 10000,
        isPrecheck: query.value.isPrecheck,
      },
    });

    allData.value = Array.isArray(res?.records) ? res.records : [];

    // 仅在出货检（isPrecheck === 0）时启用补齐
    if (query.value.isPrecheck === 0 && EXPECTED_COLUMNS.length) {
      allData.value = allData.value.map(row => {
        const out: any = {};
        for (const col of EXPECTED_COLUMNS) {
          out[col] = col in row ? row[col] : "";
        }
        return out;
      });
      columns.value = EXPECTED_COLUMNS.slice();
    } else {
      // 性能检 => 动态生成列
      columns.value = allData.value.length ? Object.keys(allData.value[0]) : [];
    }

    applyFilterAndPaginate(); // ✅ 调用分页函数
  } catch (e) {
    console.error(e);
    allData.value = [];
    tableData.value = [];
    columns.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}


function applyFilterAndPaginate() {
  total.value = allData.value.length;
  const start = (query.value.page - 1) * query.value.pageSize;
  const end = start + query.value.pageSize;
  tableData.value = allData.value.slice(start, end);

  tableData.value.forEach(item => {
    if (item.datetime) {
      item.datetime = dayjs(item.datetim).format('YYYY-MM-DD HH:mm:ss')
    }
  })
  console.log(tableData.value);
  
}

// 导出 CSV（全量数据）
// 导出 CSV（全量数据）
async function exportCSV() {
  ElMessage.info("正在导出，请稍候...");
  let allRecords: any[] = [];
  let page = 1;
  const pageSize = 500;

  while (true) {
    const res = await http.request("get", "/stereo-precheck/page", {
      params: { ...query.value, page, pageSize }
    });
    const records = res.records ?? [];
    allRecords = allRecords.concat(records);
    if (records.length < pageSize) break;
    page++;
  }

  if (!allRecords.length) {
    ElMessage.warning("没有数据可导出");
    return;
  }

  // 判断类型：出货检时补齐
  let headers: string[] = [];
  if (query.value.isPrecheck === 0 && EXPECTED_COLUMNS.length) {
    headers = EXPECTED_COLUMNS.slice();
    allRecords = allRecords.map(row => {
      const out: any = {};
      for (const col of EXPECTED_COLUMNS) {
        out[col] = col in row ? row[col] : "";
      }
      return out;
    });
  } else {
    // 性能检 => 动态列
    headers = Object.keys(allRecords[0]);
  }

  // 生成 CSV
  const csvRows: string[] = [];
  csvRows.push(headers.join(","));
  allRecords.forEach(row => {
    csvRows.push(headers.map(h => JSON.stringify(row[h] ?? "")).join(","));
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `stereo_precheck_${query.value.isPrecheck === 0 ? "ship" : "performance"}_${query.value.startDate || "all"}_${Date.now()}.csv`;
  link.click();
}

const getColumnWidth = (col) => {
  switch (col) {
    case 'datetime':
      return 180
    case 'id':
      return 80
    default:
      return 120
  }
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
        <el-date-picker v-model="query.startDate" type="datetime" placeholder="开始时间"
          value-format="YYYY-MM-DD HH:mm:ss" />
        <span style="margin: 0 8px">至</span>
        <el-date-picker v-model="query.endDate" type="datetime" placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss" />
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
      <el-table-column v-for="col in columns" :key="col" :prop="col" :label="col" show-overflow-tooltip
        :min-width="getColumnWidth(col)">
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <div class="flex justify-center mt-4">
      <el-pagination background layout="prev, pager, next, jumper, total" :total="total" :page-size="query.pageSize"
        v-model:current-page="query.page" @current-change="applyFilterAndPaginate" />
    </div>
  </el-card>
</template>
