<script setup lang="ts">
import { useProcessStoreHook } from "@/store/modules/processFlow";
import { onMounted, ref, watch } from "vue";
import SortTable from "./SortTable.vue";
import {
  createProcessFlow,
  ProcessFlow,
  updateProcessFlow
} from "@/api/processFlow";
import { DIALOG_TYPE } from "../../../../types/dialog";
import { message } from "@/utils/message";
import type { FormInstance, FormRules } from "element-plus";

const isOpen = defineModel<boolean>("isOpen");
const currentFlow = ref<ProcessFlow>();
const props = defineProps<{ dialogType: DIALOG_TYPE }>();

const processStore = useProcessStoreHook();
const title = ref("");
const isCodeDisable = ref(true);

const disableEdit = () => (isCodeDisable.value = false);
const enableEdit = () => (isCodeDisable.value = true);

const formRef = ref<FormInstance>();

const rules: FormRules = {
  process_code: [{ required: true, message: "请输入工艺编号", trigger: "blur" }],
  process_name: [{ required: true, message: "请输入工艺名称", trigger: "blur" }],
  process_desc: [{ required: true, message: "请输入工艺描述", trigger: "blur" }],
  stage_codes: [{ required: true, message: "请添加至少一个工序", trigger: "change" }]
};

const setTitle = () => {
  switch (props.dialogType) {
    case DIALOG_TYPE.UPDATE:
      title.value = "修改工艺流程信息";
      break;
    case DIALOG_TYPE.PREVIEW:
      title.value = "工艺流程详细信息";
      break;
    case DIALOG_TYPE.CREATE:
      title.value = "新增工艺流程";
      break;
    default:
      title.value = "工艺流程";
  }
};

const stageNameToCode = (names: string[]) => {
  return names.map(name => {
    const match = processStore.getProcessStepsState.find(
      item => item.stage_name === name
    );
    return match?.stage_code ?? null;
  });
};

const resetCurrentStage = () =>
  (currentFlow.value = processStore.getCurrentFlow);
const closeDialog = () => (isOpen.value = false);

const handleSubmit = async () => {
  if (!formRef.value || !currentFlow.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    const stage_codes = stageNameToCode(currentFlow.value.stage_codes);
    const data = stage_codes.map(item => ({
      process_code: currentFlow.value!.process_code,
      process_name: currentFlow.value!.process_name,
      process_desc: currentFlow.value!.process_desc,
      stage_code: item
    }));

    const isCreate = props.dialogType === DIALOG_TYPE.CREATE;
    const action = isCreate ? createProcessFlow : updateProcessFlow;
    const successMsg = isCreate ? "添加成功" : "修改成功";

    try {
      await action(data);
      message(successMsg, { type: "success" });
      processStore.setProcessFlow(true);
      closeDialog();
    } catch (err) {
      message("请求失败", { type: "error" });
      resetCurrentStage();
    }
  });
};

watch(
  () => props.dialogType,
  (newVal) => {
    setTitle();
    if (newVal === DIALOG_TYPE.CREATE) {
      currentFlow.value = {
        process_code: "",
        process_name: "",
        process_desc: "",
        stage_codes: []
      };
      disableEdit();
    } else {
      currentFlow.value = processStore.getCurrentFlow;
      enableEdit();
    }
  },
  { immediate: true }
);

watch(
  () => processStore.getCurrentFlow,
  (newVal) => {
    currentFlow.value = newVal;
  }
);

onMounted(() => {
  setTitle();
});
</script>

<template>
  <el-dialog v-model="isOpen" :title="title" width="800" :modal="false" draggable overflow @close="closeDialog">
    <el-form ref="formRef" :model="currentFlow" :rules="rules" label-width="100">
      <el-row :gutter="10" class="mb-5">
        <el-col :span="8">
          <el-form-item label="工艺编号" prop="process_code">
            <el-input v-model="currentFlow.process_code" :disabled="isCodeDisable" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工艺名称" prop="process_name">
            <el-input v-model="currentFlow.process_name" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="工艺说明" prop="process_desc">
            <el-input v-model="currentFlow.process_desc" type="textarea" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row class="flex w-full justify-end mt-5">
        <el-form-item label="流程工序" prop="stage_codes" class="w-full">
          <el-card v-if="dialogType !== 'preview'" class="w-full">
            <template #header>
              <span> 工艺流程排序 </span>
            </template>
            <SortTable v-model:cut-list="currentFlow.stage_codes" />
          </el-card>
          <div v-else class="bg-blue-300 w-full p-5 border-1 text-black rounded mt-5">
            {{ currentFlow.stage_codes.join(" > ") }}
          </div>
        </el-form-item>
      </el-row>

      <el-row class="flex justify-end mt-5">
        <el-button v-if="dialogType !== 'preview'" @click="handleSubmit">提交</el-button>
        <el-button @click="closeDialog">返回</el-button>
      </el-row>
    </el-form>
  </el-dialog>
</template>