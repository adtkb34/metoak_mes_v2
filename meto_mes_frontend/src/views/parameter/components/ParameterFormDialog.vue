<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ParameterDialogMode } from "../types";

const props = defineProps<{
  visible: boolean;
  mode: ParameterDialogMode;
  formState: { name: string; description: string; content: string };
  formRules: FormRules<{ name: string; description: string; content: string }>;
  nameDisabled: boolean;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "submit"): void;
  (event: "form-ready", ref: FormInstance | undefined): void;
}>();

const dialogTitle = computed(() =>
  props.mode === ParameterDialogMode.Edit ? "编辑参数集" : "新增参数集"
);

const formRef = ref<FormInstance>();

const notifyFormRef = () => {
  emit("form-ready", formRef.value);
};

onMounted(() => {
  notifyFormRef();
});

watch(
  () => formRef.value,
  () => {
    notifyFormRef();
  }
);
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="520px"
    :close-on-click-modal="false"
    append-to-body
    @close="emit('close')"
  >
    <el-form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      label-width="90px"
    >
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="formState.name"
          placeholder="请输入名称"
          :disabled="nameDisabled"
        />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="formState.description" placeholder="请输入描述" />
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <el-input
          v-model="formState.content"
          type="textarea"
          :rows="6"
          placeholder="请输入 JSON 格式的内容"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="emit('close')">取 消</el-button>
        <el-button type="primary" @click="emit('submit')">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
