<script setup lang="ts">
import { computed } from "vue";
import { PARAMETER_TYPE_LABELS, type ParameterDetailState } from "../types";

const props = defineProps<{
  visible: boolean;
  detail: ParameterDetailState | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (event: "close"): void;
}>();

const formattedContent = computed(() =>
  JSON.stringify(props.detail?.content ?? {}, null, 2)
);

const typeLabel = computed(() =>
  props.detail ? PARAMETER_TYPE_LABELS[props.detail.type] ?? "--" : "--"
);
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="参数集详情"
    width="720px"
    append-to-body
    :close-on-click-modal="false"
    @close="emit('close')"
  >
    <el-skeleton v-if="loading" :rows="4" animated />
    <template v-else>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="类型">
          {{ typeLabel }}
        </el-descriptions-item>
        <el-descriptions-item label="关联项">
          {{ detail?.relationName || "--" }}
        </el-descriptions-item>
        <el-descriptions-item label="名称">
          {{ detail?.name || "--" }}
        </el-descriptions-item>
        <el-descriptions-item label="版本">
          {{ detail?.versionLabel || "--" }}
        </el-descriptions-item>
        <el-descriptions-item label="描述">
          {{ detail?.description || "--" }}
        </el-descriptions-item>
        <el-descriptions-item label="创建人">
          {{ detail?.createdBy || "--" }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ detail?.createdAt || "--" }}
        </el-descriptions-item>
      </el-descriptions>
      <div class="content-title">参数内容</div>
      <pre class="json-viewer">{{ formattedContent }}</pre>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.content-title {
  margin: 12px 0 8px;
  font-weight: 600;
}

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
</style>
