<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Delete, Edit, DocumentAdd } from "@element-plus/icons-vue";
import { useProcessStore } from "@/store/modules/processFlow";
import { getUserAuth } from "@/utils/auth";
import FlowDialog from "./components/FlowDialog.vue";
import { DIALOG_TYPE } from "../../../types/dialog";
import { deleteProcessFlow } from "@/api/processFlow";
import { message } from "@/utils/message";

defineOptions({
  name: "ProcessFlow"
});

const processStore = useProcessStore();
const dialogVisible = ref(false);
const dialogType = ref(DIALOG_TYPE.PREVIEW);

function openDialog(type = DIALOG_TYPE.PREVIEW) {
  dialogVisible.value = true;
  dialogType.value = type;
}

const userAuth = ref(getUserAuth());

const shouldDisableButton = ref(true)
const shouldDisableCreate = ref(false)
const shouldDisableDelete = ref(true)

const multiSelection = ref([]);
const tableRef = ref();

const handleSelectionChange = async (selections: any[]) => {
  if (selections.length == 0) {
    multiSelection.value = []
    shouldDisableButton.value = shouldDisableDelete.value = true;
    return
  }

  shouldDisableButton.value = shouldDisableDelete.value = false;

  // 只保留最新选择的那个
  const latest = selections[selections.length - 1];

  console.log(latest, latest.length);
  // 清空所有 selection
  tableRef.value!.clearSelection();

  // 重新选中最新的
  tableRef.value!.toggleRowSelection(latest, true);

  multiSelection.value = [latest];
  await processStore.setCurrentFlow(multiSelection.value[0].process_code);
  console.log(multiSelection.value.length, latest);

};

const handleDelete = () => {
  deleteProcessFlow(multiSelection.value[0].process_code)
    .then(() => {
      message("success", { type: "success" });
      processStore.setProcessFlow(true);
    })
    .catch(e => {
      message(e, { type: "error" });
    });
};

onMounted(() => {
  processStore.setProcessFlow();
});
</script>

<template>
  <el-card>
    <FlowDialog v-model:is-open="dialogVisible" :dialog-type="dialogType" />
    <template #header>
      <div class="flex flex-col">
        <span> 工艺流程 </span>
        <div class="mt-3">
          <el-button type="primary" plain :icon="DocumentAdd" :disabled="shouldDisableCreate" @click="
            () => {
              openDialog(DIALOG_TYPE.CREATE);
              processStore.resetCurrentFlow();
            }
          ">
            新增
          </el-button>
          <el-button type="success" plain :icon="Edit" :disabled="shouldDisableButton" @click="
            () => {
              openDialog(DIALOG_TYPE.UPDATE);
              processStore.setCurrentFlow(multiSelection[0].process_code);
            }
          ">
            修改
          </el-button>
          <!-- <el-button type="danger" plain :icon="Delete" :disabled="shouldDisableDelete" @click="handleDelete">
            删除
          </el-button> -->
        </div>
      </div>
    </template>
    <el-table :data="processStore.processFlow.list" max-height="680" style="width: 100%" border
      @select="handleSelectionChange" ref="tableRef">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="process_code" label="工艺编号" />
      <el-table-column prop="process_name" label="工序名称" />
      <el-table-column prop="stage_codes" label="工艺流程">
        <template #default="scope">
          {{ scope.row.stage_codes.join(" > ") }}
        </template>
      </el-table-column>
      <el-table-column prop="process_desc" label="工序说明" />
    </el-table>
  </el-card>
</template>

<style lang="scss" scoped></style>
