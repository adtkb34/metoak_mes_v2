<template>
  <div class="production-screen">
    <header class="screen-header">
      <div>
        <p class="eyebrow">产线实时看板</p>
        <h1 class="title">装配生产大屏</h1>
        <p class="subtitle">镜头模组 · 多工序运行态</p>
      </div>
      <div class="timestamp">{{ now }}</div>
    </header>

    <div class="screen-grid">
      <section class="order-column">
        <div class="panel-head">
          <span class="panel-title">工单清单</span>
          <span class="panel-hint">编号 · 描述 · 物料 · 数量</span>
        </div>
        <div class="order-list">
          <div v-for="order in workOrders" :key="order.id" class="order-card">
            <div class="order-row">
              <span class="label">编号</span>
              <span class="value strong">{{ order.id }}</span>
            </div>
            <div class="order-row">
              <span class="label">描述</span>
              <span class="value">{{ order.description }}</span>
            </div>
            <div class="order-row">
              <span class="label">物料编码</span>
              <span class="value">{{ order.materialCode }}</span>
            </div>
            <div class="order-row">
              <span class="label">物料名称</span>
              <span class="value">{{ order.materialName }}</span>
            </div>
            <div class="order-row">
              <span class="label">数量</span>
              <span class="value strong">{{
                order.quantity.toLocaleString()
              }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="chart-column">
        <div class="panel-block">
          <div class="panel-head">
            <span class="panel-title">工序产量</span>
            <span class="panel-hint"
              >镜片组装 · 前后盖锁付 · 点胶 · IR贴片 · MTF测试</span
            >
          </div>
          <div ref="outputRef" class="chart" />
        </div>
        <div class="panel-block">
          <div class="panel-head">
            <span class="panel-title">工序 UPH</span>
            <span class="panel-hint">单位小时产出对比</span>
          </div>
          <div ref="uphRef" class="chart" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import * as echarts from "echarts";

interface WorkOrder {
  id: string;
  description: string;
  materialCode: string;
  materialName: string;
  quantity: number;
}

interface ProcessMetric {
  name: string;
  output: number;
  uph: number;
}

const workOrders = reactive<WorkOrder[]>([
  {
    id: "WO-202412-001",
    description: "镜头组件批次 A · 加工中",
    materialCode: "P01234-01",
    materialName: "广角镜头组件",
    quantity: 1200
  },
  {
    id: "WO-202412-002",
    description: "镜筒装配 · 质检优先",
    materialCode: "P04567-02",
    materialName: "精密镜筒",
    quantity: 980
  },
  {
    id: "WO-202412-003",
    description: "前盖锁付 · 夜班",
    materialCode: "P07890-05",
    materialName: "铝合金前盖",
    quantity: 860
  },
  {
    id: "WO-202412-004",
    description: "后盖锁付 · 待发料",
    materialCode: "P09999-03",
    materialName: "后盖组件",
    quantity: 910
  },
  {
    id: "WO-202412-005",
    description: "IR 贴片 · 样件",
    materialCode: "P02345-08",
    materialName: "IR 滤光片",
    quantity: 540
  },
  {
    id: "WO-202412-006",
    description: "MTF 测试 · 留样",
    materialCode: "P06789-10",
    materialName: "测试治具",
    quantity: 420
  }
]);

const processMetrics = reactive<ProcessMetric[]>([
  { name: "镜片组装", output: 520, uph: 74 },
  { name: "前盖锁付", output: 488, uph: 69 },
  { name: "后盖锁付", output: 462, uph: 66 },
  { name: "点胶", output: 438, uph: 63 },
  { name: "IR贴片", output: 412, uph: 60 },
  { name: "MTF测试", output: 398, uph: 58 }
]);

const uphTimeline = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];

const processUphHistory: Record<string, number[]> = {
  镜片组装: [66, 68, 70, 72, 74, 76],
  前盖锁付: [60, 62, 64, 66, 69, 70],
  后盖锁付: [58, 60, 62, 64, 66, 68],
  点胶: [55, 57, 59, 61, 63, 65],
  IR贴片: [52, 54, 56, 58, 60, 62],
  MTF测试: [50, 52, 54, 56, 58, 60]
};

const now = ref(new Date().toLocaleString());
let timer: number | undefined;

const outputRef = ref<HTMLDivElement>();
const uphRef = ref<HTMLDivElement>();
let outputChart: echarts.ECharts | null = null;
let uphChart: echarts.ECharts | null = null;

const processNames = computed(() => processMetrics.map(item => item.name));
const outputValues = computed(() => processMetrics.map(item => item.output));
const uphSeries = computed(() =>
  processNames.value.map(name => ({
    name,
    data: processUphHistory[name] ?? new Array(uphTimeline.length).fill(0)
  }))
);

function renderOutputChart() {
  if (!outputRef.value) return;
  if (!outputChart) {
    outputChart = echarts.init(outputRef.value);
  }

  outputChart.setOption({
    backgroundColor: "transparent",
    grid: { top: 40, left: 60, right: 30, bottom: 40 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: processNames.value,
      axisLine: { lineStyle: { color: "#4ca3ff" } },
      axisLabel: { color: "#cce6ff" }
    },
    yAxis: {
      type: "value",
      name: "产量 (件)",
      axisLine: { lineStyle: { color: "#4ca3ff" } },
      splitLine: { lineStyle: { color: "rgba(76,163,255,0.25)" } },
      axisLabel: { color: "#cce6ff" }
    },
    series: [
      {
        type: "bar",
        data: outputValues.value,
        barWidth: 36,
        itemStyle: {
          borderRadius: [10, 10, 4, 4],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#7cf3ff" },
            { offset: 1, color: "#1d5fff" }
          ]),
          shadowBlur: 18,
          shadowColor: "rgba(29,95,255,0.45)"
        },
        label: {
          show: true,
          position: "top",
          color: "#e6f7ff",
          fontWeight: 700
        }
      }
    ]
  });
}

function renderUphChart() {
  if (!uphRef.value) return;
  if (!uphChart) {
    uphChart = echarts.init(uphRef.value);
  }

  uphChart.setOption({
    backgroundColor: "transparent",
    grid: { top: 60, left: 60, right: 30, bottom: 40 },
    tooltip: { trigger: "axis" },
    legend: {
      data: processNames.value,
      textStyle: { color: "#d8ccff" },
      itemWidth: 14,
      itemHeight: 8
    },
    xAxis: {
      type: "category",
      data: uphTimeline,
      axisLine: { lineStyle: { color: "#7a6cff" } },
      axisLabel: { color: "#d8ccff" }
    },
    yAxis: {
      type: "value",
      name: "UPH",
      axisLine: { lineStyle: { color: "#7a6cff" } },
      splitLine: { lineStyle: { color: "rgba(122,108,255,0.25)" } },
      axisLabel: { color: "#d8ccff" }
    },
    series: uphSeries.value.map(({ name, data }, index) => {
      const colors = ["#c5b3ff", "#7cf3ff", "#ffcf7f", "#7fe6ff", "#ffa6e7", "#9fff6c"];
      const color = colors[index % colors.length];
      return {
        name,
        type: "line",
        smooth: true,
        data,
        symbol: "circle",
        symbolSize: 10,
        itemStyle: { color },
        lineStyle: { width: 3, color },
        label: {
          show: true,
          position: "top",
          color: "#f7f0ff",
          fontWeight: 700
        }
      };
    })
  });
}

function handleResize() {
  outputChart?.resize();
  uphChart?.resize();
}

onMounted(() => {
  renderOutputChart();
  renderUphChart();
  timer = window.setInterval(() => {
    now.value = new Date().toLocaleString();
  }, 1000);
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  if (timer) {
    clearInterval(timer);
  }
  outputChart?.dispose();
  uphChart?.dispose();
});
</script>

<style scoped>
.production-screen {
  min-height: 100vh;
  padding: 20px 22px;
  background: radial-gradient(
      circle at 20% 20%,
      rgba(0, 206, 255, 0.08),
      transparent 35%
    ),
    radial-gradient(
      circle at 80% 10%,
      rgba(122, 108, 255, 0.08),
      transparent 30%
    ),
    linear-gradient(135deg, #050c1e, #0c1e38 60%, #0b1630);
  color: #eaf5ff;
  box-sizing: border-box;
}

.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  border: 1px solid rgba(104, 191, 255, 0.35);
  border-radius: 14px;
  background: rgba(12, 30, 56, 0.75);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
}

.eyebrow {
  font-size: 13px;
  letter-spacing: 0.08em;
  color: #7dc8ff;
  text-transform: uppercase;
}

.title {
  font-size: 28px;
  margin: 6px 0 2px;
  font-weight: 800;
  color: #f6fbff;
}

.subtitle {
  color: #7da2d9;
  font-size: 14px;
}

.timestamp {
  color: #9fc9ff;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.screen-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  margin-top: 18px;
}

.order-column,
.chart-column .panel-block {
  background: rgba(8, 23, 45, 0.8);
  border: 1px solid rgba(87, 152, 255, 0.35);
  border-radius: 16px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(6px);
}

.order-column {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 4px 8px;
  border-bottom: 1px solid rgba(87, 152, 255, 0.25);
}

.panel-title {
  font-weight: 800;
  color: #f5fbff;
}

.panel-hint {
  color: #7ea8d9;
  font-size: 12px;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 180px);
  overflow: auto;
  padding-right: 6px;
}

.order-card {
  border: 1px solid rgba(104, 191, 255, 0.4);
  border-radius: 12px;
  padding: 12px;
  background: linear-gradient(
    135deg,
    rgba(20, 64, 110, 0.6),
    rgba(10, 30, 60, 0.9)
  );
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.26);
}

.order-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #cfe7ff;
  padding: 4px 0;
  border-bottom: 1px dashed rgba(87, 152, 255, 0.25);
}

.order-row:last-child {
  border-bottom: none;
}

.label {
  color: #7ea8d9;
}

.value {
  color: #f4fbff;
}

.value.strong {
  font-weight: 800;
}

.chart-column {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 16px;
}

.panel-block {
  padding: 14px 16px;
}

.chart {
  width: 100%;
  height: calc(50vh - 80px);
}

@media (max-width: 1200px) {
  .screen-grid {
    grid-template-columns: 1fr;
  }

  .order-list {
    max-height: none;
  }

  .chart-column {
    grid-template-rows: repeat(2, 360px);
  }
}
</style>
