<template>
  <el-card>
    <template #header>
      <div class="flex justify-between items-center">
        <span>{{ props.title }}</span>
        <template v-if="!realtime">
          <ExcelUploader @update:data="handleExcelUpdate" />
        </template>
      </div>
    </template>

    <div class="mb-4 flex items-center gap-4 flex-wrap">
      <el-switch v-model="realtime" active-text="实时" inactive-text="上传" />
      <el-select v-model="selectedLength" size="small" style="width: 120px">
        <el-option v-for="opt in lengthOptions" :key="opt" :label="`最近 ${opt} 个`" :value="opt" />
      </el-select>
      <el-button size="small" @click="exportWithTimestamp">导出数据</el-button>
    </div>

    <!-- <SpcChart :id="`chart-${props.key}`" :data="visibleData" :usl="props.usl" :lsl="props.lsl" /> -->
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import ExcelUploader from '@/components/ExcelUploader.vue'
import * as XLSX from 'xlsx'

const props = defineProps<{
  key: string
  title: string
  usl: number
  lsl: number
}>()

const realtime = ref(true)
const selectedLength = ref(30)
const lengthOptions = [20, 30, 50, 100]
const data = ref<number[]>([])

const intervalId = ref<any>(null)

const fetchData = async () => {
  const res = await fetch(`http://127.0.0.1:3000/spc/a?length=${selectedLength.value}`)
  const json = await res.json()
  data.value = json.data
}

const visibleData = computed(() => data.value.slice(-selectedLength.value))

watch(realtime, val => {
  if (val) {
    fetchData()
    intervalId.value = setInterval(fetchData, 1500)
  } else {
    clearInterval(intervalId.value)
  }
})

onMounted(() => {
  if (realtime.value) {
    fetchData()
    intervalId.value = setInterval(fetchData, 1500)
  }
})

onUnmounted(() => {
  clearInterval(intervalId.value)
})

function handleExcelUpdate(values: number[][], col = 1) {
  data.value = values.map(item => item[col])
  ElMessage.success(`已更新 ${values.length} 条数据`)
}

function exportWithTimestamp() {
  const ws = XLSX.utils.aoa_to_sheet(data.value.map((d, i) => [i + 1, d]))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'SPC数据')

  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `spc-export-${ts}.xlsx`
  XLSX.writeFile(wb, filename)
}
</script>
