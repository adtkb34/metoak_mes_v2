<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from "vue";
import * as echarts from "echarts";
import { ElMessage } from "element-plus";
import {
  getDeviceOptions,
  getDeviceEfficiencyStatistics,
  type DeviceOption,
  type EfficiencyStatisticsResponse
} from "@/api/device";

type DateRange = [Date, Date] | [];

const deviceOptions = ref<DeviceOption[]>([]);
const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;
const loading = ref(false);

const formState = reactive({
  deviceId: "",
  range: [] as DateRange,
  interval: "hour"
});

const intervalOptions = [
  { label: "小时", value: "hour" },
  { label: "天", value: "day" },
  { label: "周", value: "week" }
];

const statistics = ref<EfficiencyStatisticsResponse | null>(null);

const initChart = () => {
  if (chartRef.value && !chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }
};

const renderChart = () => {
  if (!chartInstance) return;
  const points = statistics.value?.points ?? [];
  chartInstance.setOption({
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: points.map(item => item.timestamp),
      name: "时间"
    },
    yAxis: {
      type: "value",
      name: "数量"
    },
    series: [
      {
        type: "line",
        name: "数量",
        smooth: true,
        data: points.map(item => item.quantity)
      }
    ]
  });
};

const fetchDeviceOptions = async () => {
  const res = await getDeviceOptions();
  deviceOptions.value = res ?? [];
};

const fetchStatistics = async () => {
  if (!formState.deviceId) {
    ElMessage.warning("请选择设备");
    return;
  }
  loading.value = true;
  try {
    const [start, end] = formState.range;
    const res = await getDeviceEfficiencyStatistics({
      deviceId: formState.deviceId,
      start: start?.toISOString(),
      end: end?.toISOString(),
      interval: formState.interval
    });
    statistics.value = res;
    renderChart();
  } finally {
    loading.value = false;
  }
};

const handleResize = () => {
  chartInstance?.resize();
};

onMounted(() => {
  initChart();
  fetchDeviceOptions();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  chartInstance?.dispose();
});
</script>

<template>
  <div class="efficiency-page">
    <el-card class="mb-4">
      <template #header>
        <div class="flex items-center gap-2">
          <span class="font-bold">效率统计</span>
        </div>
      </template>
      <el-form label-width="80px" inline :model="formState" class="w-full" @submit.prevent>
        <el-form-item label="设备">
          <el-select
            v-model="formState.deviceId"
            placeholder="请选择设备"
            clearable
            filterable
            style="width: 220px"
          >
            <el-option
              v-for="device in deviceOptions"
              :key="device.value"
              :label="device.label"
              :value="device.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="formState.range"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </el-form-item>
        <el-form-item label="间隔">
          <el-select v-model="formState.interval" style="width: 160px">
            <el-option
              v-for="option in intervalOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="fetchStatistics">
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <div ref="chartRef" class="chart-container" />
    </el-card>
  </div>
</template>

<style scoped>
.efficiency-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-container {
  width: 100%;
  height: 420px;
}
</style>
