<script setup lang="ts">
import { store } from "@/store";
import { useTagStore } from "@/store/modules/tag";
import { ref } from "vue";
import { exportToCSV, spliceFields } from "./utils";

const tagStore = useTagStore(store);

const currentOrderCode = ref();

async function handleSelectChange() {
  tagStore.setSNList(currentOrderCode.value.split(' (')[0]);
}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex flex-row items-center justify-between w-[20rem] mr-5 mb-5">
      <p>工单列表</p>
      <el-select
        v-model="currentOrderCode"
        placeholder="Select"
        style="width: 240px"
        @change="handleSelectChange"
      >
        <el-option
          v-for="order in tagStore.getOrderList"
          :key="spliceFields(order)"
          :label="spliceFields(order)"
          :value="spliceFields(order)"
        />
      </el-select>
    </div>
    <el-table :data="tagStore.getBeamSN" max-height="680" style="width: 100%">
      <el-table-column fixed type="index" width="100" />
      <el-table-column prop="beam_sn" label="序列号" />
    </el-table>
    <div class="mt-5">
      <span class="mr-5"> 总数 {{ tagStore.getBeamListLength }} </span>
      <el-button
        v-if="tagStore.getBeamSN.length > 0"
        @click="exportToCSV(tagStore.getOrderList)"
        >导出</el-button
      >
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
