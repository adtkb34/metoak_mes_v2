<script setup lang="ts">
import { computed, ref } from "vue";

defineOptions({
  name: "ParameterManagement"
});

const parameterTypes = [
  { label: "工序", value: "process" },
  { label: "工艺", value: "technology" },
  { label: "工程", value: "project" },
  { label: "工单", value: "workOrder" }
];

const selectedType = ref(parameterTypes[0].value);

const parameterPreview = computed(() => ({
  type: parameterTypes.find(item => item.value === selectedType.value)?.label ?? "",
  items: []
}));

const formattedJson = computed(() => JSON.stringify(parameterPreview.value, null, 2));
</script>

<template>
  <div class="parameter-management-page">
    <el-card class="parameter-type-card" shadow="never">
      <div class="card-content">
        <el-form inline>
          <el-form-item label="参数类型">
            <el-select v-model="selectedType" placeholder="请选择参数类型">
              <el-option
                v-for="item in parameterTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <el-card class="parameter-json-card" shadow="never">
      <template #header>
        <span>参数内容</span>
      </template>
      <pre class="json-viewer">{{ formattedJson }}</pre>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.parameter-management-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.parameter-type-card {
  min-height: 84px;

  .el-card__body {
    padding: 12px 16px;
  }
}

.card-content {
  display: flex;
  align-items: center;
}

.parameter-json-card {
  .json-viewer {
    margin: 0;
    padding: 12px 14px;
    background-color: #f5f7fa;
    border-radius: 4px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>
