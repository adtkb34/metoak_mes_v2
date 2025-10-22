<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { Delete, Edit, DocumentAdd } from "@element-plus/icons-vue";
import { useProcessStoreHook } from "@/store/modules/processFlow";
import { getUserAuth } from "@/utils/auth";
import StageDialog from "./components/StageDialog.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { deleteProcessStep } from "@/api/processFlow";

const processStore = useProcessStoreHook();
const dialogVisible = ref(false);
const dialogType = ref<"create" | "update" | "preview" | null>(null);

function openDialog(type: "create" | "update" | "preview" = "preview") {
  dialogVisible.value = true;
  dialogType.value = type;
}

// **多选始终是数组**
const multiSelection = ref<any[]>([]);
const tableRef = ref();

let isProgrammaticSelection = false;

const handleSelectionChange = (selections: any[]) => {
  // 如果是我们自己改选中状态，就直接跳过
  if (isProgrammaticSelection) return;

  if (!selections || selections.length === 0) {
    multiSelection.value = [];
    shouldDisableUpdate.value = shouldDisableDelete.value = true;
    return;
  }
  shouldDisableUpdate.value = shouldDisableDelete.value = false;

  const latest = selections[selections.length - 1];

  // 用锁标记开始
  isProgrammaticSelection = true;

  // 先清空再选中
  tableRef.value!.clearSelection();
  tableRef.value!.toggleRowSelection(latest, true);

  // 再取消锁
  isProgrammaticSelection = false;

  multiSelection.value = [latest];
};


const handleDelete = async (stage_codes: string[]) => {
  await ElMessageBox.confirm(
    `确认删除 ${stage_codes.join(", ")}`,
    "提示",
    {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning"
    }
  );
  deleteProcessStep(stage_codes)
    .then(() => {
      ElMessage.success("删除成功");
      processStore.setProcessSteps(true);
    })
    .catch(e => ElMessage.error(e.message));
};

const userAuth = ref(getUserAuth());

const shouldDisableButton = ref(true)
const shouldDisableCreate = ref(false)
const shouldDisableUpdate = ref(true)
const shouldDisableDelete = ref(true)

onMounted(async () => {
  processStore.setProcessSteps();
});
</script>
<template>
  <div>
    <StageDialog v-model:is-open="dialogVisible" v-model:dialog-type="dialogType" />
    <el-card>
      <template #header>
        <div class="flex flex-col">
          <span>工序管理</span>
          <div class="mt-3">
            <el-button type="primary" plain :icon="DocumentAdd" :disabled="shouldDisableCreate" @click="
              () => {
                processStore.unsetProcessSteps();
                openDialog('create');
              }
            ">
              新增
            </el-button>
            <el-button type="success" plain :icon="Edit" :disabled="shouldDisableUpdate" @click="
              () => {
                if (multiSelection.length > 0) {
                  processStore.setCurrentStage(multiSelection[0].stage_code);
                  openDialog('update');
                }
              }
            ">
              修改
            </el-button>
            <el-button type="danger" plain :icon="Delete" :disabled="shouldDisableDelete" @click="
              () => {
                handleDelete(multiSelection.map(item => item.stage_code));
              }
            ">
              删除
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="processStore.getProcessStepsState" max-height="680" style="width: 100%"
        @selection-change="handleSelectionChange" ref="tableRef">
        <el-table-column type="selection" width="55" />
        <el-table-column fixed prop="id" type="index" />
        <el-table-column prop="stage_code" label="工序代码" />
        <el-table-column prop="stage_name" label="工序名称" />
        <el-table-column prop="step_type_no" label="工序编号" />
        <el-table-column prop="target_table" label="目标表" />
        <el-table-column prop="stage_desc" label="工序说明" />
      </el-table>
    </el-card>
  </div>
</template>
