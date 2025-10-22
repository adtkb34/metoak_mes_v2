<template>
  <div class="w-screen h-screen bg-white dark:bg-black p-4 overflow-hidden flex flex-col">
    <!-- 均值控制图区域 -->
    <div class="flex-1 mb-4 border rounded-xl shadow-md bg-gray-50 dark:bg-gray-800 p-2">
      <SpcChart
        :data="visibleData"
        :usl="station.usl"
        :lsl="station.lsl"
        :rules="[]"
        :show-control-lines="true"
      />
    </div>

    <!-- 下方 CPK 和 缺陷图 -->
    <div class="flex-[1.5] grid grid-cols-2 gap-4">
      <div class="border rounded-xl shadow-md bg-gray-50 dark:bg-gray-800 p-2">
        <SpcCpkReport :data="visibleData" :usl="station.usl" :lsl="station.lsl" />
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="border rounded-xl bg-white dark:bg-gray-800 p-2">
          <PChart :defectiveCounts="[3, 1, 0, 2, 1, 4]" :sampleSizes="[100, 100, 100, 100, 100, 100]" :showControlLines="true" />
        </div>
        <div class="border rounded-xl bg-white dark:bg-gray-800 p-2">
          <NPChart :data="npData" :show-control-lines="true" />
        </div>
        <div class="border rounded-xl bg-white dark:bg-gray-800 p-2">
          <CChart :data="cData" :show-control-lines="true" />
        </div>
        <div class="border rounded-xl bg-white dark:bg-gray-800 p-2">
          <UChart :data="uData" :show-control-lines="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SpcChart from './components/SpcChart.vue';
import SpcCpkReport from './components/SpcCpkReport.vue';
import PChart from './components/PChart.vue';
import NPChart from './components/NPChart.vue';
import CChart from './components/CChart.vue';
import UChart from './components/UChart.vue';
import { ref, computed, onMounted } from 'vue';

const station = ref({
  usl: 65,
  lsl: 35,
  data: [] as number[],
});

const visibleData = computed(() => station.value.data.slice(-150));

const npData = [
  { defective: 3, sampleSize: 50 },
  { defective: 5, sampleSize: 50 },
  { defective: 2, sampleSize: 50 },
];

const cData = [1, 2, 1, 0, 3, 2, 1];

const uData = [
  { defects: 2, unitCount: 100 },
  { defects: 1, unitCount: 120 },
  { defects: 3, unitCount: 90 },
];

onMounted(async () => {
  try {
    const res = await fetch("http://localhost:3000/spc/a?length=200");
    const data = await res.json();
    station.value.data = data.data;
  } catch (e) {
    console.error("数据获取失败", e);
  }
});
</script>

<style scoped>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>