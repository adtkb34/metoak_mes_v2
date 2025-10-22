<template>
  <div class="h-[100%] w-[100%] pr-10 flex flex-col">
    <!-- 设置弹窗 -->
    <el-dialog v-model="showControlDialog" title="控制图设置" width="700px" destroy-on-close draggable :modal="false">
      <SpcControlPanel />
      <template #footer>
        <SpcExporter :chart-id="`chart-${station.key}`" :tableData="visibleData" />
      </template>
    </el-dialog>

    <!-- 控制图区域 -->
    <div class="p-4 flex-shrink-0">
      <div>
        <div class="text-xl font-bold">{{ spc.selectedTitle }}</div>
        <div class="flex gap-4 items-center">
          <!-- <el-select v-model="spc.selectedField" placeholder="选择字段" style="width: 180px" filterable
            @change="handleFieldChange">
            <el-option v-for="field in fields" :key="field.key" :label="field.label" :value="field.key" />
          </el-select> -->
          <el-select v-model="selectedChart" placeholder="选择控制图" style="width: 150px">
            <el-option label="均值控制图" value="spc" />
            <el-option label="极差图" value="r" />
          </el-select>
          <el-button type="primary" @click="showControlDialog = true">控制图设置</el-button>
          <ExcelUploader v-if="!spc.isRealtime" @update:data="handleExcelUpdate" />
        </div>
      </div>
      <div class="h-[40vh]">
        <SpcChart :data="visibleData" :usl="spc.usl" :lsl="spc.lsl" :show-control-lines="spc.showControlLines"
          v-if="selectedChart === 'spc'" v-model:rules="spc.selectedRules" :id="`chart-${station.key}`" />
        <RChart v-if="selectedChart === 'r'" :data="rData" :show-control-lines="spc.showControlLines" />
      </div>
    </div>

    <!-- 下方区域三栏布局 -->
    <div class="flex flex-1 gap-4 px-4 pb-4">
      <!-- 左侧 -->
      <div class="flex flex-col w-1/3 gap-4">
        <el-card class="flex-1" shadow="never">
          <NormalFit :data="visibleData" :active-tab="'normal'" />
        </el-card>
      </div>

      <!-- 中间 -->
      <div class="w-1/3">
        <el-card shadow="never">
          <SpcCpkReport ref="cpkPanelRef" :data="visibleData" :usl="spc.usl" :lsl="spc.lsl" />
        </el-card>
        <el-card class="mt-4 flex-1" shadow="never">
          <StatsSummary :data="spc.data" />
        </el-card>
      </div>

      <!-- 右侧 -->
      <div class="w-1/3">
        <el-card header="P 图" class="h-full" shadow="never">
          <PChart :defectiveCounts="[3, 1, 0, 2, 1, 4]" :sampleSizes="[100, 100, 100, 100, 100, 100]"
            :showControlLines="true" />
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import SpcChart from './components/SpcChart.vue';
import RChart from './components/RChart.vue';
import PChart from './components/PChart.vue';
import SpcExporter from './components/SpcExporter.vue';
import ExcelUploader from '@/components/ExcelUploader.vue';
import SpcCpkReport from './components/SpcCpkReport.vue';
import SpcControlPanel from './components/SpcControlPanel.vue';
import { splitIntoSubgroups } from './utils/XBarRChart';
import StatsSummary from './components/Analysis/StatsSummary.vue';
import NormalFit from './components/Analysis/NormalFit.vue';
import { useSpcStore } from '@/store/modules/SPC/v1';
import { useSpcRealtimeFetch } from '@/views/SPC/utils/composable';
import { useSpcStorev2 } from '@/store/modules/SPC/v2';

// const spc = useSpcStore();
const spc = useSpcStorev2();
const selectedChart = ref<'spc' | 'r'>('spc');
const showControlDialog = ref(false);

const visibleData = computed(() => spc.data);
const rData = computed(() => splitIntoSubgroups(visibleData.value, spc.childLength || 5));

const station = ref({
  key: '',
  title: '',
});

const fields = ref<{ key: string; label: string }[]>([]);

onMounted(async () => {
  try {
    const BASE_URL = import.meta.env.VITE_SPC_URL;
    const res = await fetch(`${BASE_URL}/spc/fields`);
    fields.value = await res.json();
    if (!spc.selectedField && fields.value.length > 0) {
      spc.selectedField = fields.value[0].key;
      spc.selectedTitle = fields.value[0].label;
    }
  } catch (e) {
    console.error(e);
  }
});

function handleFieldChange(val: string) {
  const selected = fields.value.find(f => f.key === val);
  if (selected) spc.selectedTitle = selected.label;
}

function handleExcelUpdate(newData: number[][]) {
  const col = 1;
  const parsed = newData.map(row => row[col]).filter(val => typeof val === 'number' && !isNaN(val));
  spc.data = parsed;
  ElMessage.success(`已读取 ${parsed.length} 条数据`);
}

useSpcRealtimeFetch();
</script>
