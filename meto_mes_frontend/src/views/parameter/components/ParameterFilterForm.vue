<script setup lang="ts">
import type {
  ParameterOption,
  ParameterTypeEnum,
  ParameterTypeOption
} from "../types";

const props = defineProps<{
  parameterTypes: ParameterTypeOption[];
  selectedType: ParameterTypeEnum;
  selectedOption: string | number | null;
  parameterOptions: ParameterOption[];
  optionLabel: string;
  optionPlaceholder: string;
  optionLoading: boolean;
}>();

const emit = defineEmits<{
  (event: "update:selectedType", value: ParameterTypeEnum): void;
  (event: "update:selectedOption", value: string | number | null): void;
  (event: "add"): void;
}>();

const handleTypeChange = (value: ParameterTypeEnum) => {
  emit("update:selectedType", value);
};

const handleOptionChange = (value: string | number | null) => {
  emit("update:selectedOption", value);
};

const triggerAdd = () => {
  emit("add");
};
</script>

<template>
  <el-card class="parameter-type-card" shadow="never">
    <div class="card-content">
      <div class="card-form">
        <el-form inline>
          <el-form-item label="参数类型" style="margin-bottom: 0">
            <el-select
              :model-value="selectedType"
              placeholder="请选择参数类型"
              style="width: 100px"
              @update:model-value="handleTypeChange"
            >
              <el-option
                v-for="item in parameterTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item
            :label="optionLabel"
            style="width: 300px; margin-bottom: 0"
          >
            <el-select
              :model-value="selectedOption"
              :placeholder="optionPlaceholder"
              :loading="optionLoading"
              clearable
              filterable
              :disabled="optionLoading && !parameterOptions.length"
              @update:model-value="handleOptionChange"
            >
              <el-option
                v-for="item in parameterOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <el-button class="add-button" type="primary" @click="triggerAdd">
        添加
      </el-button>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.parameter-type-card {
  min-height: 84px;

  .el-card__body {
    padding: 12px 16px;
  }
}

.card-content {
  display: flex;
  align-items: center;
  gap: 12px;

  .card-form {
    flex: 1;
  }

  .add-button {
    margin-left: auto;
  }
}
</style>
