<script setup lang="ts">
import type { FormInstance } from "element-plus";
import ParameterDetailDialog from "./components/ParameterDetailDialog.vue";
import ParameterFilterForm from "./components/ParameterFilterForm.vue";
import ParameterFormDialog from "./components/ParameterFormDialog.vue";
import ParameterTable from "./components/ParameterTable.vue";
import { useParameterDialog } from "./hooks/useParameterDialog";
import { useParameterFilters } from "./hooks/useParameterFilters";
import { useParameterPresets } from "./hooks/useParameterPresets";
import { ParameterTypeEnum, type ParameterRow } from "./types";

defineOptions({
  name: "ParameterManagement"
});

const filters = useParameterFilters();
const presets = useParameterPresets(filters);
const dialog = useParameterDialog({
  fetchDetail: presets.fetchDetail,
  onSuccess: async () => {
    await filters.fetchParameterNames();
    await presets.reloadTable();
  }
});

const handleTypeChange = (value: ParameterTypeEnum) => {
  filters.selectedType.value = value;
};

const handleOptionChange = (value: string | number | null) => {
  filters.selectedOption.value = value;
};

const handleAdd = () => {
  dialog.openCreateDialog();
};

const handleViewDetail = async (row: ParameterRow) => {
  await presets.openDetail(row);
};

const handleEdit = async (row: ParameterRow) => {
  await dialog.openEditDialog(row);
};

const handleDialogClose = () => {
  dialog.closeDialog();
};

const handleDetailClose = () => {
  presets.detailDialogVisible.value = false;
};

const handleFormReady = (ref: FormInstance | undefined) => {
  dialog.formRef.value = ref;
};
</script>

<template>
  <div class="parameter-management-page">
    <ParameterFilterForm
      :parameter-types="filters.parameterTypes"
      :selected-type="filters.selectedType.value"
      :selected-option="filters.selectedOption.value"
      :parameter-options="filters.parameterOptions.value"
      :option-label="filters.optionLabel.value"
      :option-placeholder="filters.optionPlaceholder.value"
      :option-loading="filters.optionLoading.value"
      :is-project-type="filters.isProjectType.value"
      @update:selected-type="handleTypeChange"
      @update:selected-option="handleOptionChange"
      @add="handleAdd"
    />

    <ParameterTable
      :data="presets.tableData.value"
      :loading="presets.tableLoading.value"
      @view-detail="handleViewDetail"
      @edit="handleEdit"
    />

    <ParameterFormDialog
      :visible="dialog.dialogVisible.value"
      :mode="dialog.dialogMode.value"
      :form-state="dialog.formState.value"
      :form-rules="dialog.formRules"
      :name-disabled="dialog.nameDisabled.value"
      @close="handleDialogClose"
      @submit="dialog.submitDialog"
      @form-ready="handleFormReady"
    />

    <ParameterDetailDialog
      :visible="presets.detailDialogVisible.value"
      :detail="presets.activeDetail.value"
      :loading="presets.detailLoading.value"
      @close="handleDetailClose"
    />
  </div>
</template>

<style scoped lang="scss">
.parameter-management-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
