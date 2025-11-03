<template>
  <el-card>
    <div class="parameter-toolbar">
      <div class="parameter-toolbar__actions">
        <el-button type="primary" @click="handleAdd">添加</el-button>
        <el-button type="success" :disabled="!currentRow" @click="handleEdit"
          >编辑</el-button
        >
      </div>
    </div>
    <el-table
      v-loading="loading"
      :data="configs"
      border
      highlight-current-row
      style="width: 100%"
      @current-change="handleCurrentChange"
    >
      <el-table-column fixed type="index" label="#" width="60" />
      <el-table-column prop="name" label="名称" min-width="180" />
      <el-table-column label="类型" min-width="120">
        <template #default="scope">
          <el-tag :type="scope.row.type === 1 ? 'primary' : 'warning'">
            {{ typeText(scope.row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="产品" min-width="140">
        <template #default="scope">
          {{ formatOption(scope.row.product, productOptions) }}
        </template>
      </el-table-column>
      <el-table-column label="工序" min-width="140">
        <template #default="scope">
          {{ formatOption(scope.row.process, processOptions) }}
        </template>
      </el-table-column>
      <el-table-column prop="version" label="版本" min-width="120" />
      <el-table-column
        prop="description"
        label="描述"
        min-width="240"
        show-overflow-tooltip
      />
      <el-table-column label="状态" min-width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
            {{ statusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { getParameterConfigs, getParameterOptions } from "@/api/parameter";
import type { ParameterConfig, ParameterOptions } from "types/parameter";

const router = useRouter();

const loading = ref(false);
const configs = ref<ParameterConfig[]>([]);
const currentRow = ref<ParameterConfig>();
const productOptions = ref<ParameterOptions["products"]>([]);
const processOptions = ref<ParameterOptions["processes"]>([]);

const fetchOptions = async () => {
  try {
    const data = await getParameterOptions();
    productOptions.value = data.products;
    processOptions.value = data.processes;
  } catch (error) {
    ElMessage.error("获取下拉选项失败");
  }
};

const fetchConfigs = async () => {
  loading.value = true;
  try {
    configs.value = await getParameterConfigs();
  } catch (error) {
    ElMessage.error("获取参数配置失败");
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  router.push("/system/parameter-configs/new");
};

const handleEdit = () => {
  if (!currentRow.value) {
    ElMessage.warning("请先选择需要编辑的参数配置");
    return;
  }
  router.push(`/system/parameter-configs/${currentRow.value.id}`);
};

const handleCurrentChange = (row?: ParameterConfig) => {
  currentRow.value = row;
};

const typeText = (type: ParameterConfig["type"]) => {
  return type === 1 ? "工艺" : "工程";
};

const statusText = (status: ParameterConfig["status"]) => {
  return status === 1 ? "启用" : "停用";
};

const formatOption = (
  value: string,
  options: ParameterOptions["products"] | ParameterOptions["processes"]
) => {
  const target = options.find(item => item.value === value);
  return target ? target.label : value;
};

onMounted(async () => {
  await Promise.all([fetchOptions(), fetchConfigs()]);
});
</script>

<style scoped>
.parameter-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.parameter-toolbar__actions {
  display: flex;
  gap: 12px;
}
</style>
