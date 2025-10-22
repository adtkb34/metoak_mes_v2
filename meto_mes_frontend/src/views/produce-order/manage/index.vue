<script setup lang="ts">
import { store } from "@/store";
import { useOrderStore } from "@/store/modules/order";
import { createOrder, updateOrder, getAllMaterilsFromK3, MaterialsInfo } from "@/api/order";
import { onMounted, ref, defineOptions } from "vue";
import { Delete, Edit, DocumentAdd, Plus } from "@element-plus/icons-vue";
import { getUserAuth } from "@/utils/auth";
import { DIALOG_TYPE } from "../../../../types/dialog";
import DetailDialog from "../components/DetailDialog.vue";

defineOptions({
  name: "OrderManagement"
});

const orderStore = useOrderStore(store);

const dialogVisible = ref(false);
const dialogType = ref(DIALOG_TYPE.PREVIEW);
const multiSelection = ref<any[]>([]);



function openDialog(type = DIALOG_TYPE.PREVIEW) {
  dialogVisible.value = true;
  orderStore.isOpen = true
  dialogType.value = type;
}

const tableRef = ref();

function handleSelectionChange(selections: any[]) {
  if (selections.length > 1) {
    // 只保留最新选择的那个
    const latest = selections[selections.length - 1];

    // 清空所有 selection
    tableRef.value!.clearSelection();

    // 重新选中最新的
    tableRef.value!.toggleRowSelection(latest, true);

    multiSelection.value = [latest];
  }

  if (multiSelection.value.length === 1) {
    orderStore.setCurrentOrder(multiSelection.value[0].id);
  }
}

function isBtnDisabled() {
  return getUserAuth().isBtnDisabled || multiSelection.value.length !== 1;
}

function handleDelete() {
  if (multiSelection.value.length === 1) {
    const id = multiSelection.value[0].id;
    console.log("delete", id);
    // deleteOrder(multiSelection.value[0].work_order_code)

    return
    // orderStore.deleteOrder(id); // 假设 store 里有 deleteOrder 方法
  }
}

async function handleSubmit(formData: any) {
  try {
    if (dialogType.value === 'create') {
      await createOrder(formData);

    } else if (dialogType.value === 'update') {
      await updateOrder(formData);
    }
    orderStore.reloadOrderList();
    // 成功提示
  } catch (error) {
    console.log(error)
  } finally {
    // 关闭弹窗并刷新列表
    dialogVisible.value = false;
  }
}

onMounted(() => {
  orderStore.setOrderList();

});
</script>

<template>
  <div>
    <DetailDialog v-model:visible="dialogVisible" :dialog-type="dialogType" @submit="handleSubmit" />
    <el-card>
      <template #header>
        <div class="flex flex-row gap-2">
          <el-button type="primary" plain :icon="Plus" :disabled="getUserAuth().isBtnDisabled"
            @click="openDialog(DIALOG_TYPE.CREATE)">
            新增
          </el-button>
          <el-button type="success" plain :icon="Edit" :disabled="isBtnDisabled()"
            @click="openDialog(DIALOG_TYPE.UPDATE)">
            修改
          </el-button>
          <el-button type="danger" plain :icon="Delete" disabled @click="handleDelete">
            删除
          </el-button>
        </div>

      </template>

      <el-table :data="orderStore.getOrderList" height="680" border style="width: 100%" ref="tableRef"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <!-- <el-table-column fixed type="index" label="#" align="center" /> -->
        <el-table-column prop="work_order_code" label="单据编号" align="center" />
        <el-table-column prop="description" label="单据描述" align="center" />
        <el-table-column prop="material_code" label="物料编码" align="center" />
        <el-table-column prop="material_name" label="物料名称" align="center" />
        <!-- <el-table-column prop="produce_unit" label="单位" align="center" /> -->
        <el-table-column prop="produce_count" label="数量" align="center" />
        <el-table-column prop="planned_starttime" label="计划开工时间" align="center" />
        <el-table-column prop="planned_endtime" label="计划完工时间" align="center" />
        <el-table-column prop="flow_code" label="工艺流程" align="center" />
        <!-- <el-table-column prop="completed_count" label="" align="center" /> -->

        <el-table-column fixed="right" label="操作" align="center" v-if="false">
          <template #default="scope">
            <el-button link type="primary" @click="
              async () => {
                await orderStore.setCurrentOrder(scope.row.id);
                openDialog(DIALOG_TYPE.PREVIEW);
              }
            ">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style lang="scss" scoped></style>
