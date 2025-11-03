<template>
  <el-card shadow="never" class="relative">
    <template #header>
      <div class="flex justify-between items-center">
        <div class="font-bold text-lg">SPC 分析列 {{ index }}</div>
        <div class="flex gap-2">
          <el-select v-model="selectedChart" placeholder="选择图表" size="small" style="width: 130px">
            <el-option label="均值控制图" value="spc" />
            <el-option label="极差图" value="r" />
          </el-select>
          <el-button size="small" type="primary" @click="spc.fetchData()">刷新</el-button>
          <el-button size="small" type="danger" @click="$emit('remove')">删除</el-button>
        </div>
      </div>
    </template>

    <div class="h-[35vh]">
      <SpcChart
        v-if="selectedChart === 'spc'"
        :data="visibleData"
        :usl="spc.usl"
        :lsl="spc.lsl"
        :show-control-lines="spc.showControlLines"
        v-model:rules="spc.selectedRules"
        :id="`chart-${index}`"
      />
      <RChart
        v-if="selectedChart === 'r'"
        :data="rData"
        :show-control-lines="spc.showControlLines"
      />
    </div>

    <div class="mt-4 grid grid-cols-3 gap-3">
      <el-card class="h-[200px]" shadow="never">
        <NormalFit :data="visibleData" />
      </el-card>

      <el-card class="h-[200px]" shadow="never">
        <SpcCpkReport :data="visibleData" :usl="spc.usl" :lsl="spc.lsl" />
      </el-card>

      <el-card class="h-[200px]" shadow="never">
        <StatsSummary :data="visibleData" />
      </el-card>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import SpcChart from './components/SpcChart.vue';
import RChart from './components/RChart.vue';
import SpcCpkReport from './components/SpcCpkReport.vue';
import StatsSummary from './components/Analysis/StatsSummary.vue';
import NormalFit from './components/Analysis/NormalFit.vue';
import { splitIntoSubgroups } from './utils/XBarRChart';
import { useSpcRealtimeFetch } from '@/views/SPC/utils/composable';

const props = defineProps<{
  spc: ReturnType<typeof import('@/store/modules/SPC/v2').useSpcStorev2>;
  index: number;
}>();
defineEmits(['remove']);

const selectedChart = ref<'spc' | 'r'>('spc');
const spc = props.spc;

const visibleData = computed(() => spc.data);
const rData = computed(() => splitIntoSubgroups(spc.data, spc.childLength || 5));

onMounted(() => {
  if (spc.selectedStep && spc.selectedField) {
    spc.fetchData();
  }
});

watch(
  () => [spc.selectedStep, spc.selectedField, spc.origin, spc.selectedStation],
  async ([step, field]) => {
    if (step && field) {
      await spc.fetchData().catch(console.error);
    }
  },
  { immediate: false }
);

useSpcRealtimeFetch(spc);
</script>
