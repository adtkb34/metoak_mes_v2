<template>
  <div class="flex flex-row w-full gap-4">
    <!-- 左边表格区域 -->
    <el-card class="flex-1">
      <!-- 筛选区 -->
      <el-form :inline="true" :model="query" class="mb-4">
        <el-form-item label="工序">
          <el-select v-model="stepNo" style="width: 200px;">
            <el-option v-for="item in spc.stepList.filter(c => c.tableName !== 'calibresult')" :key="item.key"
              :label="item.label" :value="item.key" />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker v-model="query.timeRange" type="datetimerange" range-separator="至"
            value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>

        <el-form-item label="相机序列号">
          <el-input v-model="query.cameraSN" placeholder="请输入 SN" clearable />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="exportCSV">导出 CSV</el-button>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-switch type="primary" v-model="enableAnalysis" active-text="打开统计图" inactive-text="关闭统计图"
            class="ml-2"></el-switch>
          <el-checkbox v-model="showHideColumn" />
          <p>: 打开隐藏列</p>
        </el-form-item>
      </el-form>
      <el-table v-if="visibleColumns" :data="rows.rows" border height="650px" class="mb-2">
        <el-table-column fixed label="SN" prop="beam_sn" />
        <el-table-column label="日期" width="200">
          <template #default="scope">
            {{ formatDateToYMDHMS(scope.row?.end_time ?? scope.row?.add_time) }}
          </template>
        </el-table-column>
        <el-table-column fixed label="失败原因" prop="ng_reason" />
        <el-table-column label="失败代码" prop="error_code" />

        <!-- 特殊分组展示 -->
        <template v-if="stepNo === '002'">
          <el-table-column label="UV前(说明: '数字-数字-xxx' '镜头位置-AA阶段-xxx'; 镜头位置从左开始计数; 3个AA阶段: UV前、UV后、松开夹爪 )">
            <el-table-column v-for="col in visibleColumns.filter(col =>
              col.label !== undefined &&
              col.label.includes('-1-') &&
              (col.isShow === 1 || showHideColumn)
            )" :key="col.prop" :prop="col.prop" :label="col.label" />
          </el-table-column>
          <el-table-column label="UV后">
            <el-table-column v-for="col in visibleColumns.filter(col =>
              col.label !== undefined &&
              col.label.includes('-2-') &&
              (col.isShow === 1 || showHideColumn)
            )" :key="col.prop" :prop="col.prop" :label="col.label" />
          </el-table-column>
          <el-table-column label="松开夹爪">
            <el-table-column v-for="col in visibleColumns.filter(col =>
              col.label !== undefined &&
              col.label.includes('-3-') &&
              (col.isShow === 1 || showHideColumn)
            )" :key="col.prop" :prop="col.prop" :label="col.label" />
          </el-table-column>
        </template>

        <!-- 其他列 -->
        <el-table-column v-for="col in visibleColumns.filter(col =>
          col.label !== undefined &&
          !col.label.includes('-1-') &&
          !col.label.includes('-2-') &&
          !col.label.includes('-3-') &&
          (col.isShow === 1 || showHideColumn)
        )" :key="col.prop" :prop="col.prop" :label="col.label" />
      </el-table>

      <!-- 分页器 -->
      <el-pagination background layout="prev, pager, next, jumper, total" :total="rows.total" :page-size="rows.pageSize"
        v-model:current-page="query.page" @current-change="fetchData" />
    </el-card>

    <!-- 右边分析图 -->
    <el-card v-if="analysisData && enableAnalysis" class="flex-1">
      <QualityErrorChart :charts-data="analysisData" />
    </el-card>
  </div>
</template>


<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { getOthersData, getOthersDataErrorCodes } from '@/api/quality'
import { useSpcStore } from '@/store/modules/SPC/v2'
import { ElMessage } from 'element-plus'
import { formatDateToYMDHMS } from '../utils'
import QualityErrorChart from '../components/QualityErrorChart.vue'

const spc = useSpcStore('table-others')
const stepNo = ref()
const analysisData = ref([0])
const enableAnalysis = ref(false);
const showHideColumn = ref(false)

const query = reactive({
  timeRange: [],
  cameraSN: '',
  page: undefined
})

const rows = ref({
  rows: [],
  columns: [],
  total: 0,
  pageSize: 20
})
const visibleColumns = ref()
const hidden = [
  'beam_sn',
  // 'add_time',
  'id',
  'position',
  'ng_reason',
  'side',
  'stage',
  'error_code',
  'station_num',
  'mo_process_step_production_result_id'
]

const fetchData = async (page = 1) => {
  if (!stepNo.value) {
    return
  }
  const [start, end] = query.timeRange || []
  let params = {
    stepNo: stepNo.value,
    startTime: start || undefined,
    endTime: end || undefined,
    cameraSN: query.cameraSN || undefined,
    page: query.page || 1
  }
  if (page == 'all') {
    delete params.page
  }
  const res = await getOthersData(params)
  rows.value = {
    rows: res.rows || [],
    columns: res.columns || [],
    total: +res.total || 0,
    pageSize: 20
  }
  analysisData.value[0] = {
    name: "总数",
    value: res.total
  }

  visibleColumns.value = rows.value.columns.filter(
    c => c && typeof c.prop === 'string' && !hidden.includes(c.prop)
  )
}

const fetchErrCodes = async () => {
  if (!stepNo.value) {
    return
  }
  const [start, end] = query.timeRange || []
  if (query.cameraSN) {
    query.page = 1
  }
  const params = {
    stepNo: stepNo.value,
    startTime: start || undefined,
    endTime: end || undefined,
    cameraSN: query.cameraSN || undefined,
  }
  const res = await getOthersDataErrorCodes(params);
  analysisData.value = res.stats.map(item => {
    return {
      name: item.error_code + '' === '0' ? `合格: ${item.count}` : `${item.error_code}: ${item.count}`,
      value: +item.count
    }
  });
}
const exportCSV = async () => {
  await fetchData('all')
  const data = rows.value
  if (!data || !data.columns || !data.rows || !data.rows.length) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  console.log(data);

  const index = data.columns.findIndex(item => item.prop === 'beam_sn')
  if (index > 0) {
    ;[data.columns[0], data.columns[index]] = [data.columns[index], data.columns[0]]
  }

  const headers = data.columns.map(c => c.label || c.prop)
  const csvRows = data.rows.map(row =>
    data.columns
      .map(c => {
        let val = row[c.prop]
        if (val == null) return ''
        return `"${String(val).replace(/"/g, '""')}"`
      })
      .join(',')
  )

  const csvContent = [headers.join(','), ...csvRows].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  link.download = `export_${timestamp}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

watch(
  () => [stepNo, query.timeRange],
  val => {
    fetchData()
    fetchErrCodes()
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  spc.fetchSteps(false)
})
</script>
