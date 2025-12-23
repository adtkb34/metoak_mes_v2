<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import {
  ParameterDialogMode,
  type ParameterOption,
  type ParameterFormState,
  type ParameterTypeEnum,
  type ParameterTypeOption
} from "../types";
import ParameterBaseSelector from "./ParameterBaseSelector.vue";
import {
  ParameterFormLabel,
  ParameterFormPlaceholder
} from "./parameterForm.constants";

const props = defineProps<{
  visible: boolean;
  mode: ParameterDialogMode;
  formState: ParameterFormState;
  formRules: FormRules<ParameterFormState>;
  nameDisabled: boolean;
  typeOptions: ParameterTypeOption[];
  relationOptions: ParameterOption[];
  relationLoading: boolean;
  relationLabel: string;
  relationPlaceholder: string;
  typeDisabled: boolean;
  relationDisabled: boolean;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "submit"): void;
  (event: "form-ready", ref: FormInstance | undefined): void;
  (event: "update:form-state", value: ParameterFormState): void;
}>();

const dialogTitle = computed(() =>
  props.mode === ParameterDialogMode.Edit ? "编辑参数集" : "新增参数集"
);
const formRef = ref<FormInstance>();
const notifyFormRef = () => emit("form-ready", formRef.value);

onMounted(() => {
  notifyFormRef();
});

watch(
  () => formRef.value,
  () => {
    notifyFormRef();
  }
);

const updateFormState = <K extends keyof ParameterFormState>(
  key: K,
  value: ParameterFormState[K]
) => {
  emit("update:form-state", {
    ...props.formState,
    [key]: value
  });
};

const handleTypeChange = (value: ParameterTypeEnum) =>
  updateFormState("type", value);
const handleRelationChange = (value: string | number | null | undefined) =>
  updateFormState("relationId", value ?? null);
const handleNameChange = (value: string) => updateFormState("name", value);
const handleDescriptionChange = (value: string) =>
  updateFormState("description", value);
const handleContentChange = (value: string) =>
  updateFormState("content", value);
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
      label-width="70px"
    >
      <ParameterBaseSelector
        :type-value="formState.type"
        :type-options="typeOptions"
        :relation-value="formState.relationId"
        :relation-options="relationOptions"
        :relation-label="relationLabel"
        :relation-placeholder="relationPlaceholder"
        :relation-loading="relationLoading"
        :type-disabled="typeDisabled"
        :relation-disabled="relationDisabled"
        :type-label="ParameterFormLabel.Type"
        :type-placeholder="ParameterFormPlaceholder.Type"
        @update:type="handleTypeChange"
        @update:relation="handleRelationChange"
      />
      <el-form-item :label="ParameterFormLabel.Name" prop="name">
        <el-input
          :model-value="formState.name"
          :placeholder="ParameterFormPlaceholder.Name"
          :disabled="nameDisabled"
          @update:model-value="handleNameChange"
        />
      </el-form-item>
      <el-form-item :label="ParameterFormLabel.Description" prop="description">
        <el-input
          :model-value="formState.description"
          :placeholder="ParameterFormPlaceholder.Description"
          @update:model-value="handleDescriptionChange"
        />
      </el-form-item>
      <el-form-item :label="ParameterFormLabel.Content" prop="content">
        <el-input
          :model-value="formState.content"
          type="textarea"
          :rows="6"
          :placeholder="ParameterFormPlaceholder.Content"
          @update:model-value="handleContentChange"
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
