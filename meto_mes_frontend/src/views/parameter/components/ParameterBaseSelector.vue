<script setup lang="ts">
import type {
  ParameterOption,
  ParameterTypeOption
} from "../types";

import { computed } from 'vue'
import { ParameterTypeEnum } from "../types";

const props = defineProps<{
  typeValue: ParameterTypeEnum;
  typeOptions: ParameterTypeOption[];
  relationValue: string | number | null;
  relationOptions: ParameterOption[];
  relationLabel: string;
  relationPlaceholder: string;
  relationLoading: boolean;
  typeDisabled: boolean;
  relationDisabled: boolean;
  typeLabel: string;
  typePlaceholder: string;
}>();

const emit = defineEmits<{
  (event: "update:type", value: ParameterTypeEnum): void;
  (event: "update:relation", value: string | number | null): void;
}>();

const handleTypeChange = (value: ParameterTypeEnum) =>
  emit("update:type", value);

const handleRelationChange = (value: string | number | null | undefined) =>
  emit("update:relation", value ?? null);

const showRelation = computed(
  () => props.typeValue !== ParameterTypeEnum.Project
);

</script>

<template>
  <el-form-item :label="typeLabel" prop="type">
    <el-select
      :model-value="typeValue"
      :disabled="typeDisabled"
      :placeholder="typePlaceholder"
      @update:model-value="handleTypeChange"
    >
      <el-option
        v-for="item in typeOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </el-form-item>
  <el-form-item v-if="showRelation" :label="relationLabel" prop="relationId">
    <el-select
      :model-value="relationValue"
      :disabled="relationDisabled"
      :placeholder="relationPlaceholder"
      :loading="relationLoading"
      clearable
      filterable
      @update:model-value="handleRelationChange"
    >
      <el-option
        v-for="item in relationOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </el-form-item>
</template>
