<script setup lang="ts">
import { store } from "@/store";
import { useTagStore } from "@/store/modules/tag";
import { onMounted, ref, watch } from "vue";
import { getCurrentYearCode, spliceFields } from "./utils";
import { getBeamMaterialCode } from "@/api/tag";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear.js";
import { generateSN } from "@/api/tag";
import { useUserListStore } from "@/store/modules/system";
import { max } from "mathjs";

defineOptions({
  name: "TagManagement"
});


const userStore = useUserListStore(store);
const selectMaterialCode = ref();
const total = ref(0);
const currentOrderCode = ref();
const selectAddr = ref("M");
const selectOperate = ref("Z");
const isWeekInputDisabled = ref(true);

const weekNum = dayjs().week();

const tagStore = useTagStore(store);
const snList = ref();

async function handleGenerate() {
  if (total.value === 0) {
    return;
  }

  const beam_sn_prefix =
    selectMaterialCode.value +
    getCurrentYearCode() +
    weekNum +
    selectAddr.value +
    selectOperate.value;

  const result = await generateSN(
    total.value,
    tagStore.getOrderCode,
    tagStore.getProduceID,
    beam_sn_prefix
  );

  if (result) {
    snList.value = result.data;
  }
  tagStore.setSNList(currentOrderCode.value.split(' (')[0]);
}

onMounted(() => {
  dayjs.extend(weekOfYear);
  tagStore.setOrderList();
  tagStore.setMaterialCode();
});

watch(currentOrderCode, async (newVal, oldVal) => {
  if (newVal !== null) {
    total.value = 0
    tagStore.setSNList(currentOrderCode.value.split(' (')[0]);
    selectMaterialCode.value = null
    getBeamMaterialCode(newVal.split(' (')[0]).then(res => {
      selectMaterialCode.value = res.material_letter;

    });;
  }
});
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex flex-row justify-start items-center w-full mb-5">
      <!-- head -->
      <div class="flex flex-row items-center justify-between w-[20rem] mr-5">
        <p>工单列表</p>
        <el-select v-model="currentOrderCode" placeholder="Select" style="width: 240px" @change="
          async () => {
            tagStore.setCurrentOrder(currentOrderCode);
          }
        ">
          <el-option v-for="order in tagStore.getOrderList" :key="spliceFields(order)" :label="spliceFields(order)"
            :value="spliceFields(order)" />
        </el-select>
      </div>
      <div class="mr-5">
        <span>计划生产数量: </span>
        <el-tag type="info">{{ tagStore.getOrder?.produce_count ?? 0 }}</el-tag>
      </div>
      <div>
        <span>已生成数量: </span>
        <el-tag type="info">{{
          tagStore.getBeamListLength
        }}</el-tag>
      </div>
    </div>
    <div class="flex flex-col mr-5 w-full justify-center items-end">
      <div class="w-full flex flex-row">
        <el-card class="w-1/3 h-[40rem] mr-5">
          <template #header> 自动生成 </template>
          <el-row :gutter="20">
            <el-col :span="24" class="mb-5">
              <span>编码</span>
              <div class="inline-flex w-1/2 ml-5">
                <el-input v-model="selectMaterialCode" />
              </div>
            </el-col>

            <el-col :span="24" class="mb-5">
              <span>产地</span>
              <div class="inline-flex ml-5 w-1/2">
                <el-select v-model="selectAddr" placeholder="产地" :default-first-option="true">
                  <el-option label="M_绵阳" value="M" />
                  <el-option label="S_苏州" value="S" />
                  <el-option label="J_嘉兴" value="J" />
                  <el-option label="B_北京" value="B" />
                  <el-option label="W_武汉" value="W" />
                  <el-option label="H_合肥" value="H" />
                </el-select>
              </div>
            </el-col>

            <el-col :span="24" class="mb-5">
              <span>方式</span>
              <div class="inline-flex w-1/2 ml-5">
                <el-select v-model="selectOperate" placeholder="生产方式">
                  <el-option label="S_手工" value="S" />
                  <el-option label="Z_自动" value="Z" />
                </el-select>
              </div>
            </el-col>

            <el-col :span="24" class="mb-5">
              <span class="mr-5">周数</span>
              <div class="inline-flex">
                <el-input v-model="weekNum" class="mr-5"
                  :disabled="isWeekInputDisabled || userStore.getUserLevel > 1" />
                <el-checkbox v-if="userStore.getUserLevel <= 1" :value="isWeekInputDisabled"
                  @change="() => (isWeekInputDisabled = !isWeekInputDisabled)" />
              </div>
            </el-col>

            <el-col :span="24" class="mb-8">
              <span>数量</span>
              <div class="inline-flex ml-5">
                <el-input-number v-model="total" placeholder="请输入" :min="0" />
              </div>
            </el-col>

            <el-col :span="24">
              <el-button v-if="userStore.getUserLevel < 2 && currentOrderCode && selectMaterialCode"
                @click="handleGenerate">生成</el-button>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="w-auto flex flex-row">
          <el-table :data="snList" max-height="595" style="width: 100%" border>
            <el-table-column fixed type="index" />
            <el-table-column prop="beam_sn" label="序列号" />
          </el-table>
        </el-card>

        <!-- <el-card class="flex-1 ml-5">
          <template #header>
            <span>手动导入</span>
          </template>
        </el-card> -->
      </div>
      <div />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
