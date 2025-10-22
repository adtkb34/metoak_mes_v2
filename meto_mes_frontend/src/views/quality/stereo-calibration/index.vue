<template>
  <el-card>
    <!-- 筛选区 -->
    <el-form :inline="true" :model="query" class="mb-4">
      <el-form-item label="时间范围">
        <el-date-picker v-model="query.timeRange" type="datetimerange" range-separator="至"
          value-format="YYYY-MM-DD HH:mm:ss" />
      </el-form-item>

      <el-form-item label="相机序列号">
        <el-input v-model="query.cameraSN" placeholder="请输入 SN" clearable />
      </el-form-item>

      <el-form-item label="页数">
        <el-input-number v-model="query.page" controls-position="right" @change="fetchData" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="exportCSV">导出 CSV</el-button>
        <el-button type="primary" @click="fetchData">查询</el-button>
      </el-form-item>
    </el-form>

    <!-- 数据表 -->
    <el-table :data="rows.rows" height="700px">
      <el-table-column type="index" />
      <el-table-column label="SN" prop="CameraSN" />
      <el-table-column label="日期" prop="TimeStamp" />
      <el-table-column label="光心">
        <el-table-column label="Simor">
          <el-table-column label="左cx" prop="Simor_left_cx" />
          <el-table-column label="左cy" prop="Simor_left_cy" />
          <el-table-column label="右cx" prop="Simor_right_cx" />
          <el-table-column label="右cy" prop="Simor_right_cy" />
        </el-table-column>
        <el-table-column label="ISP">
          <el-table-column label="左cx" prop="ISP_left_cx" />
          <el-table-column label="左cy" prop="ISP_left_cy" />
          <el-table-column label="右cx" prop="ISP_right_cx" />
          <el-table-column label="右cy" prop="ISP_right_cy" />
        </el-table-column>
      </el-table-column>
      <el-table-column label="清晰度">
        <el-table-column label="左" prop="LeftSharpness" />
        <el-table-column label="右" prop="RightSharpness" />
      </el-table-column>
      <el-table-column label="基线">
        <el-table-column label="Simor" prop="Simor_baseline" />
        <el-table-column label="ISP" prop="ISP_baseline" />
      </el-table-column>
      <el-table-column label="平均逆投影误差">
        <el-table-column label="Simor" prop="Simor_mean_reprojection_error" />
        <el-table-column label="ISP" prop="ISP_mean_reprojection_error" />
      </el-table-column>
      <el-table-column label="中心">
        <el-table-column label="左图X" prop="LeftCenterOffsetX" />
        <el-table-column label="左图Y" prop="LeftCenterOffsetY" />
        <el-table-column label="右图X" prop="RightCenterOffsetX" />
        <el-table-column label="右图Y" prop="RightCenterOffsetY" />
      </el-table-column>
      <el-table-column label="FOV">
        <el-table-column label="Simor">
          <el-table-column label="水平" prop="Simor_fov_h" />
          <el-table-column label="垂直" prop="Simor_fov_v" />
        </el-table-column>
        <el-table-column label="ISP">
          <el-table-column label="水平" prop="ISP_fov_h" />
          <el-table-column label="垂直" prop="ISP_fov_v" />
        </el-table-column>
      </el-table-column>
      <el-table-column label="放大比例">
        <el-table-column label="Simor" prop="Simor_amplify_ratio" />
        <el-table-column label="ISP" prop="ISP_amplify_ratio" />
      </el-table-column>
    </el-table>

    <el-pagination background layout="total, sizes, prev, pager, next, jumper" :page-size="query.pageSize"
      :page-sizes="pageSizes" :current-page="query.page" :total="rows.total" @current-change="handlePageChange"
      @size-change="handleSizeChange" />
  </el-card>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { getStereoCalibrationData } from '@/api/quality' // 你的接口
/* 筛选参数 */
const rows = ref({ rows: [], columns: [], total: 0 })

const query = reactive({
  page: 1,
  pageSize: 20,
  cameraSN: '',
  timeRange: [],
})

/* 拉取数据 */
const fetchData = async () => {
  const [start, end] = query.timeRange || []

  const params = {
    startTime: start || undefined,
    endTime: end || undefined,
    cameraSN: query.cameraSN || undefined,
    page: query.page,
    pageSize: query.pageSize,
  }

  const res = await getStereoCalibrationData(params)
  rows.value = res // rows, columns, total
}

const exportCSV = async () => {
  const [start, end] = query.timeRange || []
  const paramsBase = {
    startTime: start || undefined,
    endTime: end || undefined,
    cameraSN: query.cameraSN || undefined,
  }

  let allRows = []
  let page = 1
  const pageSize = 300 // 后端要支持可调
  while (true) {
    const { rows: pageRows, columns } = await getStereoCalibrationData({
      ...paramsBase,
      page,
      pageSize, // 后端接收
    })
    if (!pageRows || pageRows.length === 0) break
    allRows = allRows.concat(pageRows)
    page++
  }

  // columns 直接取第一次的
  const { columns } = await getStereoCalibrationData({
    ...paramsBase,
    page: 1,
    pageSize,
  })

  // 生成CSV
  const headers = columns.map(c => c.COLUMN_NAME || c.COLUMN_COMMENT)
  const csvRows = allRows.map(row =>
    columns.map(c => {
      let val = row[c.COLUMN_NAME]
      if (val == null) return ''
      return `"${String(val).replace(/"/g, '""')}"`
    }).join(',')
  )

  const csvContent = [headers.join(','), ...csvRows].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  link.download = `export_${timestamp}.csv`
  link.click()
  URL.revokeObjectURL(url)
}


const handlePageChange = (val) => {
  query.page = val
  fetchData()
}

const handleSizeChange = (val) => {
  query.pageSize = val
  query.page = 1
  fetchData()
}


/* 首次加载 */
// fetchData()
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>