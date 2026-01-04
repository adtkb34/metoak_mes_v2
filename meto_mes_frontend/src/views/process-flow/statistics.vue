<template>
  <el-card>
    <div class="header">
      <h2>工序产量统计看板</h2>
    </div>

    <!-- 1. 筛选区域 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="时间维度">
          <el-radio-group v-model="queryParams.dateType" @change="handleTypeChange">
            <el-radio-button label="today">今日实时</el-radio-button>
            <el-radio-button label="history">历史区间</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="日期范围" v-if="queryParams.dateType === 'history'">
          <el-date-picker v-model="queryParams.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
            end-placeholder="结束日期" value-format="YYYY-MM-DD" :disabled-date="disabledDate" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="fetchData" :loading="loading">
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 数据表格区域 -->
    <el-card shadow="hover" class="table-card">
      <el-table v-loading="loading" :data="tableData" style="width: 100%" stripe border @row-click="handleRowClick"
        class="process-table">
        <el-table-column prop="stageCode" label="工序代码" width="120" />
        <el-table-column prop="stageName" label="工序名称" width="180" />

        <el-table-column prop="yieldRate" label="良率">
          <template #default="scope">
            <el-tag
              :type="scope.row.yieldRate === '-' ? 'info' : (parseFloat(scope.row.yieldRate) < 90 ? 'danger' : 'success')">
              {{ scope.row.yieldRate }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="productionCount" label="总产量" />

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click.stop="handleRowClick(scope.row)">
              查看趋势
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 3. 折线图弹窗 -->
    <el-dialog v-model="dialogVisible" :title="currentProcessName + ' - 产量趋势'" width="700px" @closed="handleCloseChart">
      <div v-if="!hasChartData" class="no-data">
        <el-empty description="暂无该工序的时间段数据" />
      </div>
      <div v-show="hasChartData" ref="chartRef" class="chart-container"></div>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { http } from '@/utils/http';

// --- 状态定义 ---
const loading = ref(false);
const tableData = ref([]);
const dialogVisible = ref(false);
const currentProcessName = ref('');
const chartRef = ref(null);
const hasChartData = ref(false);
let myChart = null;

// 查询参数
const queryParams = reactive({
  processId: '111',
  dateType: 'today',
  dateRange: []
});

// 禁止选择未来日期
const disabledDate = (time) => time.getTime() > Date.now();

// 切换类型处理
const handleTypeChange = (val) => {
  if (val === 'today') {
    queryParams.dateRange = [];
    fetchData();
  } else {
    tableData.value = [];
  }
};

// --- 核心：使用 fetch 获取真实数据 ---
const fetchData = async () => {
  // 1. 校验参数
  if (queryParams.dateType === 'history') {
    if (!queryParams.dateRange || queryParams.dateRange.length !== 2) {
      ElMessage.warning('请选择历史查询的时间范围');
      return;
    }
  }

  loading.value = true;

  try {
    const params = new URLSearchParams();
    params.append('processId', queryParams.processId);
    params.append('dateType', queryParams.dateType);

    if (queryParams.dateType === 'history') {
      const start = queryParams.dateRange[0];
      const end = queryParams.dateRange[1];

      console.log(start);
      
      // 修复语法：正确格式化日期
      // params.append('startDate', start.toISOString());
      // params.append('endDate', end.toISOString());
    }

    const requestUrl = `/mes/v1/process-statistics?${params.toString()}`;
    console.log(requestUrl);
    
    const response = await http.request('get', requestUrl);
    const resData = response

    if (resData && resData.statistics) {
      tableData.value = resData.statistics;
      ElMessage.success('数据加载成功');
    } else {
      tableData.value = [];
      ElMessage.info('未查询到数据');
    }

  } catch (error) {
    console.error('Fetch error:', error);
    ElMessage.error('获取数据失败: ' + error.message);
    tableData.value = [];
  } finally {
    loading.value = false;
  }
};

// --- ECharts ---
const handleRowClick = (row) => {
  currentProcessName.value = row.stageName;

  const hourlyData = row.hourlyProduction || {};
  const times = Object.keys(hourlyData);
  const values = Object.values(hourlyData);

  hasChartData.value = times.length > 0;
  dialogVisible.value = true;

  if (hasChartData.value) {
    nextTick(() => initChart(times, values));
  }
};

const initChart = (xAxisData, seriesData) => {
  if (!chartRef.value) return;
  if (myChart) myChart.dispose();

  myChart = echarts.init(chartRef.value);
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: xAxisData },
    yAxis: { type: 'value', name: '产量(pcs)' },
    series: [
      {
        name: '产量',
        type: 'line',
        stack: 'Total',
        data: seriesData,
        smooth: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#409EFF' },
        label: { show: true, position: 'top' }
      }
    ]
  };

  myChart.setOption(option);
};

const handleCloseChart = () => {
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
};

onMounted(() => {
  fetchData();
});
</script>


<style scoped>
.header {
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  background: #fff;
}

.process-table {
  cursor: pointer;
}

.chart-container {
  width: 100%;
  height: 400px;
}

.no-data {
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>