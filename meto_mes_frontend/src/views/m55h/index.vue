<template>
  <div class="m55h-page">
    <el-card>

      <!-- 查询表单 -->
      <el-form :inline="true" :model="query" class="mb-4">
        <el-form-item label="SN">
          <el-input v-model="query.sn" placeholder="输入SN查询" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button type="success" @click="exportAll">导出全部</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="tableData" border style="width: 100%" height="650">
        <el-table-column prop="id" sortable type="index" />
        <el-table-column prop="datetime" label="时间" width="180">
          <template #default="{ row }">
            {{ formatToUTC8(row.datetime) }}
          </template>
        </el-table-column>
        <el-table-column prop="sn" sortable :sort-method="snSort" label="SN" width="160" />
        <!-- <el-table-column prop="operator" label="操作人员" /> -->
        <el-table-column prop="check_result" label="检测结果">
          <template #default="{ row }">
            <el-tag :type="row.check_result ? 'success' : 'danger'">
              {{ row.check_result ? 'OK' : 'NG' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="can0_status" label="can0">
          <template #default="{ row }">
            <el-tag :type="row.can0_ok ? 'success' : 'danger'">
              {{ row.can0_ok ? 'OK' : 'NG' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="check_result" label="can1">
          <template #default="{ row }">
            <el-tag :type="row.can1_ok ? 'success' : 'danger'">
              {{ (row.can1_ok || row.can1_ok === null) ? 'OK' : 'NG' }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- <el-table-column prop="version_adas" label="ADAS版本" /> -->
        <el-table-column prop="version_mcu" label="MCU版本" />
        <el-table-column prop="version_spi" label="SPI版本" />
        <el-table-column prop="pack_version" label="SOC 包版本" />
        <el-table-column prop="product_version" label="产品版本" />
      </el-table>

      <!-- 分页 -->
      <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next" :total="total" @current-change="fetchData" @size-change="fetchData"
        class="mt-4" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import { http } from "@/utils/http";
import { formatToUTC8 } from "@/utils/date";

const query = reactive({
  sn: "",
  page: 1,
  pageSize: 10,
});

const tableData = ref<any[]>([]);
const total = ref(0);

async function fetchData() {
  const res = await http.request<Promise<{ data: { list: any[]; total: number } }>>(
    "get",
    "/m55h/page",
    { params: query }
  );

  if (res && res.data) {
    const list = res.data.list
      //  按日期降序排序（注意先转换时间）
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
      //  填充 null 值 + 调整时区
      .map(item => {
        const utc = new Date(item.datetime);
        const beijing = new Date(utc.getTime() + 8 * 60 * 60 * 1000); // UTC+8

        const formatted = beijing.toISOString().replace("T", " ").substring(0, 19);

        return {
          ...item,
          datetime: formatted,                // 改为北京时间字符串
          image_ok: item.image_ok === null ? true : item.image_ok,
          can0_ok: item.can0_ok === null ? true : item.can0_ok,
          can1_ok: item.can1_ok === null ? true : item.can1_ok,
        };
      });

    tableData.value = list;
    total.value = res.data.total;
  } else {
    tableData.value = [];
    total.value = 0;
  }
}

function snSort(a: any, b: any) {
  const numA = parseInt(a.sn.replace(/\D/g, ''), 10)
  const numB = parseInt(b.sn.replace(/\D/g, ''), 10)
  return numA - numB
}

// 上传表单
const form = reactive({
  sn: "",
  operator: "",
  error_code: 0,
  check_result: true,
});

async function submit() {
  await axios.post("/api/m55h/upload", form);
  ElMessage.success("提交成功");
  fetchData();
}

async function exportAll() {
  ElMessage.info("开始导出，请稍候...");

  const pageSize = 100; // 每次请求多少条，可改大点
  let page = 1;
  let allData: any[] = [];
  let total = 0;

  try {
    while (true) {
      const res = await http.request<Promise<{ data: { list: [], total: number } }>>("get", "/m55h/page", {
        params: { ...query, page, pageSize },
      });

      const list = res.data.list;
      total = res.data.total;

      if (!list || !list.length) break;

      allData = allData.concat(list);

      // 输出进度
      const progress = Math.min((allData.length / total) * 100, 100).toFixed(1);
      console.log(`已加载 ${allData.length}/${total} (${progress}%)`);

      // 如果加载完最后一页则停止
      if (allData.length >= total) break;

      page++;
    }

    if (!allData.length) {
      ElMessage.warning("无可导出的数据");
      return;
    }

    // 构建 CSV 内容
    const headers = [
      "时间",
      "SN",
      "操作人员",
      "检测结果",
      "CAN0",
      "CAN1",
      // "ADAS版本",
      "MCU版本",
      "SPI版本",
      "SOC包版本",
      "产品版本",
    ];

    const rows = allData.map(row => [
      formatToUTC8(row.datetime),
      row.sn,
      row.operator,
      row.check_result ? "OK" : "NG",
      row.can0_status ? "OK" : "NG",
      row.can1_status ? "OK" : "NG",
      row.version_adas,
      row.version_mcu,
      row.version_spi,
      row.pack_version,
      row.product_version,
    ]);

    const csvContent =
      headers.join(",") + "\n" +
      rows.map(r => r.map(v => `"${v ?? ""}"`).join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:T]/g, "-").split(".")[0];
    link.href = url;
    link.download = `m55h_export_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    ElMessage.success(`导出成功，共 ${allData.length} 条数据`);
  } catch (err) {
    console.error(err);
    ElMessage.error("导出失败");
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.m55h-page {
  padding: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.upload-form {
  max-width: 600px;
}
</style>
