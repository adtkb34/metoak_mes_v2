<script setup lang="ts">
import { PARAMETER_TYPE_LABELS, type ParameterRow } from "../types";

const props = defineProps<{
  data: ParameterRow[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (event: "view-detail", row: ParameterRow): void;
  (event: "edit", row: ParameterRow): void;
}>();

const formatType = (type: number) => PARAMETER_TYPE_LABELS[type] ?? "--";
const formatText = (value?: string) => value || "--";

const handleView = (row: ParameterRow) => emit("view-detail", row);
const handleEdit = (row: ParameterRow) => emit("edit", row);
</script>

<template>
  <el-card shadow="never">
    <el-table
      :data="data"
      height="520"
      border
      style="width: 100%"
      :loading="loading"
    >
      <!-- <el-table-column label="类型" align="center" prop="type" min-width="90">
        <template #default="scope">
          {{ formatType(scope.row.type) }}
        </template>
      </el-table-column> -->
      <el-table-column
        label="关联项"
        align="center"
        prop="relationName"
        min-width="140"
      >
        <template #default="scope">
          {{ formatText(scope.row.relationName) }}
        </template>
      </el-table-column>
      <el-table-column
        label="名称"
        align="center"
        prop="name"
        min-width="160"
      />
      <el-table-column
        label="描述"
        align="center"
        prop="description"
        min-width="200"
        show-overflow-tooltip
      />
      <el-table-column
        label="版本"
        align="center"
        prop="versionLabel"
        min-width="100"
      >
        <template #default="scope">
          {{ formatText(scope.row.versionLabel) }}
        </template>
      </el-table-column>
      <el-table-column
        label="创建人"
        align="center"
        prop="createdBy"
        min-width="120"
      >
        <template #default="scope">
          {{ formatText(scope.row.createdBy) }}
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createdAt"
        min-width="160"
      >
        <template #default="scope">
          {{ formatText(scope.row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" width="160">
        <template #default="scope">
          <el-button link type="primary" @click="handleView(scope.row)">
            详情
          </el-button>
          <el-button link type="primary" @click="handleEdit(scope.row)">
            编辑
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
