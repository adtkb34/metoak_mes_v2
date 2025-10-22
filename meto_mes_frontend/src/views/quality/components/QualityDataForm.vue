<script setup lang="ts">
import { QualityFormData } from "types/quality";
import { computed } from "vue";

defineOptions({
  name: "QualityAnalysis"
});

type WithTitle = QualityFormData & { title: string };

const props = defineProps({
  listData: {
    type: Array<QualityFormData>,
    default: () => []
  }
});

const titleList = [
  { title: "手动定焦" },
  { title: "自动定焦" },
  { title: "标定" },
  { title: "终检" },
  { title: "出货检" }
];

const mergedList = computed<WithTitle[]>(() => {
  return props.listData.map((item, index) => ({
    ...item,
    ...titleList[index]
  }));
});
</script>

<template>
  <div>
    <el-table :data="mergedList" border max-height="550" style="width: 100%">
      <el-table-column prop="title" label="工序名称" />
      <el-table-column prop="passRate" label="合格率">
        <template #default="scope">
          {{ (scope.row.passRate * 100).toFixed(1) + "%" }}
        </template>
      </el-table-column>
      <el-table-column prop="qualificationRate" label="一次良率">
        <template #default="scope">
          {{ (scope.row.qualificationRate * 100).toFixed(1) + "%" }}
        </template>
      </el-table-column>
      <el-table-column prop="defects" label="不良数" />
      <el-table-column prop="total" label="总数" />
    </el-table>
  </div>
</template>

<style lang="scss" scoped></style>
