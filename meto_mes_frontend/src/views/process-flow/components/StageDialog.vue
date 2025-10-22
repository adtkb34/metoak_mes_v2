<script setup lang="ts">
import {
  createProcessSteps,
  ProcessFlowSteps,
  updateProcessSteps
} from "@/api/processFlow";
import { useProcessStoreHook } from "@/store/modules/processFlow";
import { message } from "@/utils/message";
import { ref, watch } from "vue";

const isOpen = defineModel("isOpen", { type: Boolean });
const dialogType = defineModel("dialogType", { type: String });

const processStore = useProcessStoreHook();
const currentStage = ref<ProcessFlowSteps>({} as ProcessFlowSteps);

watch(
  () => processStore.getCurrentStage,
  (newVal) => {
    currentStage.value = { ...newVal };
  },
  { immediate: true }
);

const resetCurrentStage = () =>
  (currentStage.value = processStore.getCurrentStage);
const closeDialog = () => (isOpen.value = false);

const formRef = ref();
const rules = {
  stage_code: [
    { required: true, message: "请输入工序代码", trigger: "blur" }
  ],
  stage_name: [
    { required: true, message: "请输入工序名称", trigger: "blur" }
  ],
  stage_desc: [
    { required: true, message: "请输入工序说明", trigger: "blur" }
  ]
};

const handleSubmit = () => {
  formRef.value?.validate((valid: boolean) => {
    if (valid) {
      const isCreate = dialogType.value === "create";
      const action = isCreate ? createProcessSteps : updateProcessSteps;
      const successMsg = isCreate ? "添加成功" : "修改成功";
      action(currentStage.value)
        .then(() => {
          message(successMsg, { type: "success" });
          processStore.setProcessSteps(true);
        })
        .catch(() => {
          message("工序重复", { type: "error" });
          resetCurrentStage();
        })
        .finally(() => closeDialog());
    }
  });
};
</script>

<template>
  <el-dialog v-model="isOpen" width="800" :modal="false" draggable overflow @close="closeDialog">
    <el-form :model="currentStage" :rules="rules" ref="formRef" label-width="100px">
      <el-row :gutter="10" class="mb-5">
        <el-col :span="8" v-if="dialogType != 'create'">
          <el-form-item label="工序代码" prop="stage_code">
            <el-input v-model="currentStage.stage_code" :disabled="dialogType != 'create'" />
          </el-form-item>
        </el-col>

        <el-col :span="8">
          <el-form-item label="工序名称" prop="stage_name">
            <el-input v-model="currentStage.stage_name" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="目标表" prop="target_table">
            <el-input v-model="currentStage.target_table" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工序编号" prop="step_type_no">
            <el-input v-model="currentStage.step_type_no" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="10" class="mb-5">
        <el-col :span="16">
          <el-form-item label="工序说明" prop="stage_desc">
            <el-input v-model="currentStage.stage_desc" type="textarea" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row class="flex justify-end mt-5">
        <el-button type="primary" @click="handleSubmit">确定</el-button>
        <el-button @click="closeDialog">返回</el-button>
      </el-row>
    </el-form>
  </el-dialog>
</template>

<style lang="scss" scoped></style>