<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{ data: Array<Record<string, any>> }>();

const historyData = ref<Array<Record<string, any>>>([]);
const historyDays = ref<Array<string>>([]);

// 固定字段及其中文映射
const fieldMap: Record<string, string> = {
  adjust: "手动定焦",
  aa: "自动定焦",
  assemble: "组装外壳",
  calibration: "标定",
  finalcheck: "终检",
  fitpcba: "装配PCBA",
  oqc: "出货检",
  pack1: "装箱",
  pack2: "装箱",
  days: "日期" // 可选，不用于转置，但便于字段管理
};

const fields = Object.keys(fieldMap).filter(f => f !== "days"); // 排除 days 字段

function transpose(data: Array<Record<string, any>>) {
  if (data.length === 0) {
    historyData.value = [];
    historyDays.value = [];
    return;
  }

  // 提取所有唯一的 days 并排序
  const days = Array.from(new Set(data.map(item => item.days))).sort();
  historyDays.value = days;

  // 构造转置后的表格数据
  const transposed = fields.map(field => {
    const row: Record<string, any> = { field: fieldMap[field] || field };
    days.forEach(day => {
      const item = data.find(d => d.days === day);
      row[day] = item && field in item ? item[field] : "";
    });
    return row;
  });

  historyData.value = transposed;
}

watch(
  () => props.data,
  newVal => {
    transpose(newVal || []);
  },
  { immediate: true }
);
</script>

<template>
  <div>
    <span>历史生产信息</span>
    <el-table :data="historyData" border height="280">
      <el-table-column prop="field" label="工位名称" />
      <el-table-column
        v-for="day in historyDays"
        :key="day"
        :prop="day"
        :label="day"
      />
    </el-table>
  </div>
</template>

<style scoped lang="scss"></style>
