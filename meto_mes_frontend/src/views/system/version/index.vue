<template>
  <el-card class="version-card">
    <div class="version-card__header">
      <span>版本信息</span>
      <el-button link type="primary" :loading="loading" @click="fetchBackendVersion">
        刷新后端版本
      </el-button>
    </div>
    <el-descriptions :column="1" border>
      <el-descriptions-item label="前端版本">
        {{ frontendVersion }}
      </el-descriptions-item>
      <el-descriptions-item label="后端版本">
        <span v-if="!loading">{{ backendVersion || "--" }}</span>
        <el-skeleton v-else animated :rows="1" style="width: 120px" />
      </el-descriptions-item>
    </el-descriptions>
    <el-alert
      v-if="errorMessage"
      class="version-card__alert"
      type="error"
      show-icon
      :closable="false"
      :title="errorMessage"
    />
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { getBackendVersion } from "@/api/version";

const frontendVersion = computed(() => import.meta.env.VITE_APP_VERSION ?? "未配置");

const backendVersion = ref<string>("");
const loading = ref(false);
const errorMessage = ref("");

const fetchBackendVersion = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const data = await getBackendVersion();
    backendVersion.value = data.backendVersion;
  } catch (error) {
    backendVersion.value = "";
    errorMessage.value = "获取后端版本失败，请稍后重试";
    console.error(error);
    ElMessage.error(errorMessage.value);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchBackendVersion);
</script>

<style scoped>
.version-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.version-card__alert {
  margin-top: 16px;
}
</style>
