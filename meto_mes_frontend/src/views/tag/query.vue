<script setup lang="ts">
import { store } from "@/store";
import { useTagStore } from "@/store/modules/tag";
import { computed, onMounted, ref, watch } from "vue";
import { exportToCSV, spliceFields } from "./utils";
import type { LabelType } from "types/tag";

const tagStore = useTagStore(store);

const currentOrderCode = ref<string>();
const currentLabelType = ref<LabelType>("beam");

const labelTypeOptions: { label: string; value: LabelType }[] = [
  { label: "横梁标签", value: "beam" },
  { label: "外壳标签", value: "shell" }
];

const serialField = computed(() => tagStore.getSerialField as "beam_sn" | "tag_sn");
const serialColumnLabel = computed(() =>
  tagStore.getCurrentLabelType === "shell" ? "外壳序列号" : "横梁序列号"
);
const serialList = computed(() => tagStore.getBeamSN);

async function handleSelectChange() {
  if (!currentOrderCode.value) return;
  const workOrderCode = currentOrderCode.value.split(" (")[0];
  await tagStore.setSNList(workOrderCode, currentLabelType.value);
}

function handleExport() {
  if (serialList.value.length === 0) return;
  const key = serialField.value;
  const rows = serialList.value.map(item => ({
    序列号: (item as Record<typeof key, string>)[key] ?? ""
  }));
  const typeLabel = tagStore.getCurrentLabelType === "shell" ? "shell" : "beam";
  exportToCSV(rows, `${tagStore.getOrderCode || "tag"}_${typeLabel}_tags.csv`);
}

watch(currentLabelType, async newType => {
  if (!currentOrderCode.value) return;
  const workOrderCode = currentOrderCode.value.split(" (")[0];
  await tagStore.setSNList(workOrderCode, newType);
});

onMounted(() => {
  tagStore.setOrderList();
});
</script>

<template>
  <div class="flex flex-col">
    <div class="flex flex-row items-center justify-between mr-5 mb-5">
      <div class="flex flex-row items-center mr-8">
        <p class="mr-3">工单列表</p>
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
      <div class="flex flex-row items-center">
        <p class="mr-3">标签类型</p>
        <el-select
          v-model="currentLabelType"
          placeholder="标签类型"
          style="width: 160px"
        >
          <el-option
            v-for="option in labelTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </div>
    </div>
    <el-table :data="serialList" max-height="680" style="width: 100%">
      <el-table-column fixed type="index" width="100" />
      <el-table-column :prop="serialField" :label="serialColumnLabel" />
    </el-table>
    <div class="mt-5">
      <span class="mr-5"> 总数 {{ tagStore.getBeamListLength }} </span>
      <el-button v-if="serialList.length > 0" @click="handleExport">导出</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
