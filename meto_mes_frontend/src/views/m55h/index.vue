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
        <el-table-column prop="operator" label="操作人员" />
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
              {{ row.can1_ok ? 'OK' : 'NG' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version_adas" label="ADAS版本" />
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
  const res = await http.request<Promise<{ data: { list: [], total: number } }>>("get", "/m55h/page", { params: query });
  tableData.value = res.data.list;
  console.log(res);

  if (res) {
    total.value = res.data.total;
    return;
  }
  total.value = 0;
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
