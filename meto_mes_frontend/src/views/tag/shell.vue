<script setup lang="ts">
import { store } from "@/store";
import { useTagStore } from "@/store/modules/tag";
import { computed, onMounted, ref, watch } from "vue";
import { exportToCSV, getCurrentYearCode, spliceFields } from "./utils";
import {
  generateShellSN,
  getBeamMaterialCode,
  getShellTagConfig,
  markSerialNumbersUsed,
  saveShellTagConfig
} from "@/api/tag";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear.js";
import { useUserListStore } from "@/store/modules/system";
import type { ShellSerialItem } from "types/tag";

defineOptions({
  name: "ShellTagManagement"
});

const userStore = useUserListStore(store);
const machineCode = ref<string>("");
const processCode = ref<string>("");
const total = ref(0);
const currentOrderId = ref<number | null>(null);
const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "";
const defaultOrigin = backendUrl.includes("11.11.11.15") ? "S" : "M";
const selectAddr = ref(defaultOrigin);
const isWeekInputDisabled = ref(true);
const weekNum = ref(dayjs().week().toString().padStart(2, "0"));
const serialPrefix = ref("");
const exportAll = ref(false);

const tagStore = useTagStore(store);
const materialFilterPrefix = ref("900.");
const filteredOrderList = computed(() => {
  return tagStore.getOrderList.filter(o => 
    o.material_code?.startsWith(materialFilterPrefix.value)
  );
});
const snList = ref<ShellSerialItem[]>([]);

const selectedOrder = computed(() =>
  tagStore.getOrderList.find(order => order.id === currentOrderId.value) || null
);
const selectedWorkOrderCode = computed(() => selectedOrder.value?.work_order_code ?? "");

const shellSnPrefix = computed(() => {
  const segments = [
    machineCode.value ?? "",
    processCode.value ?? "",
    getCurrentYearCode(),
    weekNum.value ?? "",
    selectAddr.value,
    serialPrefix.value ?? ""
  ];

  const prefix = segments.filter(Boolean).join("");
  return prefix.toUpperCase();
});

const isExportDisabled = computed(() => snList.value.length === 0);
const generatedCount = computed(() => snList.value.length);
const exportedCount = computed(() => snList.value.filter(item => item.is_used === 1).length);
const unexportedCount = computed(() => Math.max(generatedCount.value - exportedCount.value, 0));

const fetchShellSerialNumbers = async () => {
  if (!selectedWorkOrderCode.value) return;
  await tagStore.setSNList(selectedWorkOrderCode.value, "shell");
  snList.value = tagStore.getBeamSN as ShellSerialItem[];
};

async function handleGenerate() {
  if (total.value === 0 || !shellSnPrefix.value) {
    return;
  }

  const currentOrder = tagStore.getOrder;
  if (currentOrder?.material_code) {
    await saveShellTagConfig({
      material_code: currentOrder.material_code,
      project_name: currentOrder.material_name,
      whole_machine_code: machineCode.value || undefined,
      process_code: processCode.value || undefined,
      serial_prefix: serialPrefix.value || undefined
    });
  }

  if (!selectedWorkOrderCode.value) {
    return;
  }

  await generateShellSN({
    total: total.value,
    work_order_code: tagStore.getOrderCode,
    produce_order_id: Number(tagStore.getProduceID) || undefined,
    shell_sn_prefix: shellSnPrefix.value,
    serial_prefix: serialPrefix.value
  });

  await fetchShellSerialNumbers();
}

async function handleExport() {
  if (isExportDisabled.value) return;
  if (!selectedWorkOrderCode.value) return;
  const exportList = exportAll.value
    ? snList.value
    : snList.value.filter(item => item.is_used !== 1);
  if (!exportList.length) return;

  const rows = exportList.map(item => ({ 序列号: item.tag_sn }));
  exportToCSV(rows, `${tagStore.getOrderCode || "shell"}_shell_tags.csv`);

  const unusedSerials = exportList
    .filter(item => item.is_used !== 1)
    .map(item => item.tag_sn);

  if (!unusedSerials.length) {
    return;
  }

  await markSerialNumbersUsed({
    work_order_code: selectedWorkOrderCode.value,
    label_type: "shell",
    serial_numbers: unusedSerials
  });

  await fetchShellSerialNumbers();
}

onMounted(() => {
  dayjs.extend(weekOfYear);
  tagStore.setOrderList();
  tagStore.setMaterialCode();
});

watch(
  () => currentOrderId.value,
  newVal => {
    tagStore.setCurrentOrder(newVal ?? null);
    if (newVal == null) {
      snList.value = [];
      total.value = 0;
      machineCode.value = "";
      processCode.value = "";
      serialPrefix.value = "";
    }
  }
);

watch(
  () => selectedWorkOrderCode.value,
  async workOrderCode => {
    if (!workOrderCode) return;
    total.value = 0;
    snList.value = [];
    await fetchShellSerialNumbers();
    machineCode.value = "";
    processCode.value = "";
    serialPrefix.value = "";
    try {
      const res = await getBeamMaterialCode(workOrderCode);
      machineCode.value = res.material_letter ?? "";
    } catch (error) {
      machineCode.value = "";
    }

    const currentOrder = selectedOrder.value;
    if (currentOrder?.material_code) {
      const config = await getShellTagConfig({
        material_code: currentOrder.material_code,
        project_name: currentOrder.material_name
      });
      machineCode.value = config?.whole_machine_code ?? machineCode.value ?? "";
      processCode.value = config?.process_code ?? "";
      serialPrefix.value = config?.serial_prefix ?? "";
    }
  }
);

// exportAll now only affects export scope
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex flex-row justify-start items-center w-full mb-5">

      <div class="flex flex-row items-center justify-between w-[30rem] mr-5">
        <p>工单列表</p>
        <el-select
          v-model="currentOrderId"
          filterable
          placeholder="Select"
          style="width: 80%"
        >
          <el-option
            v-for="order in filteredOrderList"
            :key="order.id"
            :label="spliceFields(order)"
            :value="order.id"
          />
        </el-select>
      </div>
        <div class="flex flex-row items-center justify-between w-[20rem] mr-5">
        <p>物料编码前缀</p>
        <el-input
          v-model="materialFilterPrefix"
          placeholder="输入物料编码前缀"
          style="width: 60%"
        />
      </div>
      <div class="mr-5">
        <span>计划生产数量: </span>
        <el-tag type="info">{{ tagStore.getOrder?.produce_count ?? 0 }}</el-tag>
      </div>
      <div>
        <span>已生成数量: </span>
        <el-tag type="info">{{ generatedCount }}</el-tag>
      </div>
      <div class="ml-5 flex items-center gap-3">
        <el-tag type="success">已导出: {{ exportedCount }}</el-tag>
        <el-tag type="warning">未导出: {{ unexportedCount }}</el-tag>
      </div>
      <div class="ml-auto flex items-center">
        <span class="mr-2">导出全部</span>
        <el-switch v-model="exportAll" />
      </div>
    </div>
    <div class="flex flex-col mr-5 w-full justify-center items-end">
      <div class="w-full flex flex-row">
        <el-card class="w-1/3 h-[40rem] mr-5">
          <template #header> 自动生成 </template>
          <el-row :gutter="20">
          <el-col :span="24" class="mb-5 flex items-center">
              <span class="label-width">整机代码</span>
              <div class="inline-flex w-1/2 ml-5">
                <el-input v-model="machineCode" />
              </div>
            </el-col>

            <el-col :span="24" class="mb-5 flex items-center">
              <span class="label-width">工艺代码</span>
              <div class="inline-flex w-1/2 ml-5">
                <el-input v-model="processCode" />
              </div>
            </el-col>

            <el-col :span="24" class="mb-5 flex items-center">
              <span class="label-width">产地</span>
              <div class="inline-flex ml-5 w-1/2">
                <el-select
                  v-model="selectAddr"
                  placeholder="产地"
                  :default-first-option="true"
                >
                  <el-option label="M_绵阳" value="M" />
                  <el-option label="S_苏州" value="S" />
                  <el-option label="J_嘉兴" value="J" />
                  <el-option label="B_北京" value="B" />
                  <el-option label="W_武汉" value="W" />
                  <el-option label="H_合肥" value="H" />
                </el-select>
              </div>
            </el-col>
            
            <el-col :span="24" class="mb-5 flex items-center">
              <span class="label-width">周数</span>
              <div class="inline-flex items-center w-1/2 ml-5">
                <el-input
                  v-model="weekNum"
                  class="mr-5"
                  :disabled="isWeekInputDisabled || userStore.getUserLevel > 1"
                />
                <el-checkbox
                  v-if="userStore.getUserLevel <= 1"
                  :value="isWeekInputDisabled"
                  @change="() => (isWeekInputDisabled = !isWeekInputDisabled)"
                />
              </div>
            </el-col>

            <el-col :span="24" class="mb-5 flex items-center">
              <span class="label-width">流水号前缀</span>
              <div class="inline-flex w-1/2 ml-5">
                <el-input v-model="serialPrefix" />
              </div>
            </el-col>

            <el-col :span="24" class="mb-5 flex items-center">
              <span class="label-width">数量</span>
              <div class="inline-flex w-1/2 ml-5">
                <el-input-number
                  v-model="total"
                  placeholder="请输入"
                  :min="0"
                />
              </div>
            </el-col>

            <el-col :span="24">
              <el-button
                v-if="userStore.getUserLevel < 2 && currentOrderId && machineCode"
                @click="handleGenerate"
                >生成</el-button
              >
              <el-button
                class="ml-3"
                :disabled="isExportDisabled"
                @click="handleExport"
                >导出标签</el-button
              >
            </el-col>
          </el-row>
        </el-card>

        <el-card class="w-auto flex-1">
          <template #header>
            <div class="flex justify-between items-center">
              <span>序列号列表</span>
              <el-tag type="info">前缀: {{ shellSnPrefix || "-" }}</el-tag>
            </div>
          </template>
          <el-table :data="snList" max-height="595" style="width: 100%" border>
            <el-table-column fixed type="index" />
            <el-table-column prop="tag_sn" label="序列号" />
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.is_used === 1 ? 'success' : 'warning'">
                  {{ row.is_used === 1 ? "已导出" : "未导出" }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
      <div />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.label-width {
  width: 80px; /* 根据最长的"流水号前缀"调整宽度 */
  text-align: right;
  display: inline-block;
}
</style>
