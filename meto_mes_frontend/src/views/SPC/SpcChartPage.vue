<template>
  <div class="spc-dashboard w-[95%] h-full p-4 flex flex-col gap-4 overflow-auto">
    <!-- 多行控制图面板 -->
    <div v-for="panel in panels" :key="panel.id"
      class="spc-panel border border-gray-200 rounded-md shadow-sm bg-white p-4 flex flex-col gap-4">
      <!-- 面板头部 -->
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-4">
          <div class="text-xl font-bold">{{ chartTitle(panel.id) }}</div>
          <el-select v-model="panel.selectedChart" placeholder="选择控制图" style="width: 150px">
            <el-option label="均值控制图" value="spc" />
            <el-option label="极差图" value="r" />
          </el-select>
        </div>
        <div class="flex gap-2">
          <el-button type="primary" @click="panel.showDialog = true">控制图设置</el-button>
          <el-button type="danger" text @click="removePanel(panel.id)">删除</el-button>
        </div>
      </div>

      <!-- 控制图设置弹窗 -->
      <el-dialog v-model="panel.showDialog" title="控制图设置" width="700px" destroy-on-close draggable :modal="false">
        <SpcControlPanel :spc="panel.spc" />
        <template #footer>
          <SpcExporter :chart-id="`chart-${panel.id}`" :tableData="panel.spc.data" />
        </template>
      </el-dialog>


      <!-- 控制图 -->
      <div class="h-[40vh]">
        <SpcChart v-if="panel.selectedChart === 'spc'" :data="panel.spc.data" :usl="panel.spc.usl" :lsl="panel.spc.lsl"
          :show-control-lines="panel.spc.showControlLines" v-model:rules="panel.spc.selectedRules"
          :id="`chart-${panel.id}`" />
        <RChart v-else :data="splitIntoSubgroups(panel.spc.data, panel.spc.childLength || 5)"
          :show-control-lines="panel.spc.showControlLines" />
      </div>

      <!-- 下方三栏 -->
      <div class="flex flex-1 gap-4">
        <!-- 左 -->
        <el-card class="flex-1" shadow="never">
          <NormalFit :data="panel.spc.data" :active-tab="'normal'" />
        </el-card>

        <!-- 中 -->
        <div class="flex flex-col flex-1 gap-4">
          <el-card shadow="never">
            <SpcCpkReport :data="panel.spc.data" :usl="panel.spc.usl" :lsl="panel.spc.lsl" />
          </el-card>
          <el-card shadow="never">
            <StatsSummary :data="panel.spc.data" :ng="panel.spc.ng.length" />
          </el-card>
        </div>

        <!-- 右 -->
        <!-- <el-card header="P 图" class="flex-1" shadow="never">
          <PChart :defectiveCounts="[3, 1, 0, 2, 1, 4]" :sampleSizes="[100, 100, 100, 100, 100, 100]"
            :showControlLines="true" />
        </el-card> -->
      </div>
    </div>

    <!-- 新增按钮 -->
    <div class="text-center">
      <el-button type="primary" @click="addPanel">新增分析行</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SpcChart from './components/SpcChart.vue'
import RChart from './components/RChart.vue'
import PChart from './components/PChart.vue'
import SpcExporter from './components/SpcExporter.vue'
import SpcCpkReport from './components/SpcCpkReport.vue'
import SpcControlPanel from './components/SpcControlPanel.vue'
import StatsSummary from './components/Analysis/StatsSummary.vue'
import NormalFit from './components/Analysis/NormalFit.vue'
import { splitIntoSubgroups } from './utils/XBarRChart'
import { createSpcStore, useSpcStore } from '@/store/modules/SPC/v2'

// 每行一个 store
interface Panel {
  id: string
  spc: ReturnType<ReturnType<typeof createSpcStore>>
  showDialog: boolean
  selectedChart: 'spc' | 'r'
}

const panels = ref<Panel[]>([])

function addPanel() {
  const id = `${Date.now()}`
  const store = createSpcStore(id)()
  store.fetchSteps()
  panels.value.push({
    id,
    spc: store,
    showDialog: false,
    selectedChart: 'spc',
  })
}

function removePanel(id: string) {
  panels.value = panels.value.filter((p) => p.id !== id)
}

// 默认添加一行
addPanel()

const getStore = (id: string) => useSpcStore(id);

// 生成标题
const chartTitle = (id: string) => {
  const spc = getStore(id)
  const stepLabel = spc.stepList.find(i => i.key === spc.selectedStep)?.label || spc.selectedStep || ''
  const attrLabel = spc.attrList.find(i => i.key === spc.selectedField)?.label || spc.selectedField || ''
  if (stepLabel && attrLabel) return `${stepLabel} : ${attrLabel}`
  return '未选择任务与参数'
}
</script>

<style scoped>
.spc-dashboard {
  overflow-y: auto;
  overflow-x: auto;
}

.spc-panel {
  min-height: 70vh;
}
</style>
