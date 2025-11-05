<script setup lang="ts">
import { store } from "@/store";
import { useTagStore } from "@/store/modules/tag";
import { computed, onMounted, ref, watch } from "vue";
import { exportToCSV, getCurrentYearCode, spliceFields } from "./utils";
import { generatebeamSN, getBeamMaterialCode } from "@/api/tag";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear.js";
import { useUserListStore } from "@/store/modules/system";

defineOptions({
  name: "ShellTagManagement"
});

const userStore = useUserListStore(store);
const machineCode = ref<string | null>(null);
const processCode = ref<string | null>(null);
const total = ref(0);
const currentOrderCode = ref<string | null>(null);
const selectAddr = ref("M");
const selectOperate = ref("Z");
const isWeekInputDisabled = ref(true);
const weekNum = ref(dayjs().week().toString().padStart(2, "0"));
const serialPrefix = ref("");

const tagStore = useTagStore(store);
const snList = ref<{ beam_sn: string }[]>([]);

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

async function handleGenerate() {
  if (total.value === 0 || !shellSnPrefix.value) {
    return;
  }

  const result = await generatebeamSN(
    total.value,
    tagStore.getOrderCode,
    tagStore.getProduceID,
    shellSnPrefix.value
  );

  if (result) {
    snList.value = result.data ?? [];
  }
  if (currentOrderCode.value) {
    const workOrderCode = currentOrderCode.value.split(" (")[0];
    await tagStore.setSNList(workOrderCode);
    snList.value = tagStore.getBeamSN;
  }
}

function handleExport() {
  if (isExportDisabled.value) return;
  const rows = snList.value.map(item => ({ 序列号: item.beam_sn }));
  exportToCSV(rows, `${tagStore.getOrderCode || "shell"}_shell_tags.csv`);
}

onMounted(() => {
  dayjs.extend(weekOfYear);
  tagStore.setOrderList();
  tagStore.setMaterialCode();
});

watch(currentOrderCode, async newVal => {
  if (newVal) {
    total.value = 0;
    snList.value = [];
    const workOrderCode = newVal.split(" (")[0];
    await tagStore.setSNList(workOrderCode);
    snList.value = tagStore.getBeamSN;
    machineCode.value = null;
    processCode.value = null;
    getBeamMaterialCode(workOrderCode).then(res => {
      machineCode.value = res.material_letter;
    });
  }
});
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex flex-row justify-start items-center w-full mb-5">
      <div class="flex flex-row items-center justify-between w-[20rem] mr-5">
        <p>工单列表</p>
        <el-select
          v-model="currentOrderCode"
          placeholder="Select"
          style="width: 240px"
          @change="
            async () => {
              tagStore.setCurrentOrder(currentOrderCode as string);
            }
          "
        >
          <el-option
            v-for="order in tagStore.getOrderList"
            :key="spliceFields(order)"
            :label="spliceFields(order)"
            :value="spliceFields(order)"
          />
        </el-select>
      </div>
      <div class="mr-5">
        <span>计划生产数量: </span>
        <el-tag type="info">{{ tagStore.getOrder?.produce_count ?? 0 }}</el-tag>
      </div>
      <div>
        <span>已生成数量: </span>
        <el-tag type="info">{{ tagStore.getBeamListLength }}</el-tag>
      </div>
    </div>
    <div class="flex flex-col mr-5 w-full justify-center items-end">
      <div class="w-full flex flex-row">
        <el-card class="w-1/3 h-[40rem] mr-5">
          <template #header> 自动生成 </template>
          <el-row :gutter="20">
            <el-col :span="24" class="mb-5">
              <span>整机代码</span>
              <div class="inline-flex w-1/2 ml-5">
                <el-input v-model="machineCode" />
              </div>
            </el-col>

            <el-col :span="24" class="mb-5">
              <span>工艺代码</span>
              <div class="inline-flex w-1/2 ml-5">
                <el-input v-model="processCode" />
              </div>
            </el-col>

            <el-col :span="24" class="mb-5">
              <span>产地</span>
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

            <!-- <el-col :span="24" class="mb-5">
              <span>方式</span>
              <div class="inline-flex w-1/2 ml-5">
                <el-select v-model="selectOperate" placeholder="生产方式">
                  <el-option label="S_手工" value="S" />
                  <el-option label="Z_自动" value="Z" />
                </el-select>
              </div>
            </el-col> -->

            <el-col :span="24" class="mb-5">
              <span class="mr-5">周数</span>
              <div class="inline-flex items-center">
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

            <el-col :span="24" class="mb-5">
              <span>流水号前缀</span>
              <div class="inline-flex w-1/2 ml-5">
                <el-input v-model="serialPrefix" />
              </div>
            </el-col>

            <el-col :span="24" class="mb-5">
              <span>数量</span>
              <div class="inline-flex ml-5">
                <el-input-number
                  v-model="total"
                  placeholder="请输入"
                  :min="0"
                />
              </div>
            </el-col>

            <el-col :span="24" class="mb-5">
              <el-alert type="info" :closable="false" show-icon>
                <template #title>
                  当前序列号前缀: {{ shellSnPrefix || "-" }}
                </template>
              </el-alert>
            </el-col>

            <el-col :span="24">
              <el-button
                v-if="
                  userStore.getUserLevel < 2 && currentOrderCode && machineCode
                "
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
            <el-table-column prop="beam_sn" label="序列号" />
          </el-table>
        </el-card>
      </div>
      <div />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
