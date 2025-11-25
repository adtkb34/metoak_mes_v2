<template>
  <div class="neo-screen" :class="{ fullscreen: isFullscreen }">
    <div class="grid-overlay" />
    <div class="scanline" />
    <div class="content-shell">
      <header class="screen-header">
        <div>
          <p class="eyebrow">mock data · cyber production board</p>
          <h1 class="title">工单极客大屏</h1>
          <div class="meta-row">
            <span class="pill">{{ currentProductData.process }}</span>
            <span class="pill">{{ currentProductData.line }}</span>
          </div>
        </div>
        <div class="action-group">
          <el-button class="ghost-btn" @click="selectionVisible = true">
            <el-icon><Cpu /></el-icon>
            选择工序 / 工单 / 产品
          </el-button>
          <el-button class="primary-btn" @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
            {{ isFullscreen ? "退出全屏" : "一键全屏" }}
          </el-button>
        </div>
      </header>

      <section class="metric-grid">
        <div class="metric-card highlight">
          <p class="label">工单编号</p>
          <p class="value">{{ currentProductData.workOrder }}</p>
          <p class="hint">高优先级 · 实时追踪</p>
        </div>
        <div class="metric-card">
          <p class="label">产品</p>
          <p class="value">{{ currentProductData.product }}</p>
          <p class="hint">{{ currentProductData.variant }}</p>
        </div>
        <div class="metric-card">
          <p class="label">计划产量</p>
          <p class="value">{{ currentProductData.plan }} pcs</p>
          <div class="progress">
            <div class="progress-bar" :style="{ width: `${completionPercent}%` }" />
          </div>
          <p class="hint">完成率 {{ completionPercent }}%</p>
        </div>
        <div class="metric-card">
          <p class="label">一次良率</p>
          <p class="value">{{ firstPassPercent }}%</p>
          <p class="hint">首件至今趋势稳定</p>
        </div>
        <div class="metric-card">
          <p class="label">今日产能</p>
          <p class="value">{{ currentProductData.capacityToday }} pcs</p>
          <p class="hint">班次：{{ currentProductData.shift }}</p>
        </div>
        <div class="metric-card">
          <p class="label">UPH</p>
          <p class="value">{{ latestUph }} /h</p>
          <p class="hint">实时刷新 · 近12小时</p>
        </div>
      </section>

      <section class="charts">
        <div class="chart-card">
          <div class="card-head">
            <div>
              <p class="label">质量柏拉图</p>
              <p class="hint">缺陷贡献 + 累计占比</p>
            </div>
            <el-tag type="success" effect="dark">{{ currentProductData.batch }}</el-tag>
          </div>
          <div ref="paretoRef" class="chart-body" />
        </div>
        <div class="chart-card">
          <div class="card-head">
            <div>
              <p class="label">UPH 动态</p>
              <p class="hint">产能波动 · 霓虹曲线</p>
            </div>
            <el-tag effect="dark">{{ currentProductData.tempo }}</el-tag>
          </div>
          <div ref="uphRef" class="chart-body" />
        </div>
      </section>
    </div>

    <el-dialog
      v-model="selectionVisible"
      width="680px"
      destroy-on-close
      class="selection-dialog"
      title="选择工序 / 工单 / 产品"
    >
      <div class="selection-grid">
        <div class="selection-col">
          <p class="label">工序</p>
          <el-select v-model="selectedProcess" placeholder="选择工序" filterable>
            <el-option
              v-for="item in processOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </div>
        <div class="selection-col">
          <p class="label">工单</p>
          <el-select v-model="selectedOrder" placeholder="选择工单" filterable>
            <el-option
              v-for="item in orderOptions"
              :key="item.id"
              :label="`${item.id} · ${item.title}`"
              :value="item.id"
            />
          </el-select>
        </div>
        <div class="selection-col">
          <p class="label">产品</p>
          <el-select v-model="selectedProduct" placeholder="选择产品" filterable>
            <el-option
              v-for="item in productOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </div>
      </div>
      <template #footer>
        <el-button class="ghost-btn" @click="selectionVisible = false">取消</el-button>
        <el-button class="primary-btn" @click="applySelection">切换看板</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { Cpu, FullScreen } from "@element-plus/icons-vue";
import * as echarts from "echarts";

interface ParetoPoint {
  issue: string;
  count: number;
}

interface UphPoint {
  label: string;
  value: number;
}

interface ProductBoard {
  product: string;
  variant: string;
  plan: number;
  completion: number;
  firstPass: number;
  capacityToday: number;
  shift: string;
  uphTrend: UphPoint[];
  pareto: ParetoPoint[];
  workOrder: string;
  process: string;
  line: string;
  batch: string;
  tempo: string;
}

interface OrderBoard {
  id: string;
  title: string;
  products: ProductBoard[];
}

interface ProcessBoard {
  process: string;
  orders: OrderBoard[];
}

const mockData: ProcessBoard[] = reactive([
  {
    process: "SMT 回流焊", // 1
    orders: [
      {
        id: "WO-240512-01",
        title: "AI 控制板 · 加急",
        products: [
          {
            product: "AI 控制主板",
            variant: "12层 · DDR5 · 高速链路",
            plan: 1200,
            completion: 0.72,
            firstPass: 0.985,
            capacityToday: 830,
            shift: "白班 08:00 - 20:00",
            workOrder: "WO-240512-01",
            process: "SMT 回流焊",
            line: "SMT-02 高速线",
            batch: "Lot#B2405-SMT",
            tempo: "62s tact",
            uphTrend: [
              { label: "08:00", value: 68 },
              { label: "09:00", value: 72 },
              { label: "10:00", value: 75 },
              { label: "11:00", value: 79 },
              { label: "12:00", value: 76 },
              { label: "13:00", value: 81 },
              { label: "14:00", value: 83 },
              { label: "15:00", value: 84 },
              { label: "16:00", value: 82 },
              { label: "17:00", value: 80 },
              { label: "18:00", value: 77 },
              { label: "19:00", value: 75 }
            ],
            pareto: [
              { issue: "印刷偏位", count: 34 },
              { issue: "元件虚焊", count: 28 },
              { issue: "锡珠", count: 22 },
              { issue: "少锡", count: 18 },
              { issue: "连锡", count: 11 },
              { issue: "立碑", count: 9 },
              { issue: "极性错误", count: 6 }
            ]
          },
          {
            product: "边缘计算板",
            variant: "8层 · NPU 版",
            plan: 860,
            completion: 0.54,
            firstPass: 0.972,
            capacityToday: 620,
            shift: "白班 08:00 - 20:00",
            workOrder: "WO-240512-01",
            process: "SMT 回流焊",
            line: "SMT-02 高速线",
            batch: "Lot#B2405-SMT",
            tempo: "74s tact",
            uphTrend: [
              { label: "08:00", value: 51 },
              { label: "09:00", value: 58 },
              { label: "10:00", value: 62 },
              { label: "11:00", value: 63 },
              { label: "12:00", value: 60 },
              { label: "13:00", value: 66 },
              { label: "14:00", value: 69 },
              { label: "15:00", value: 71 },
              { label: "16:00", value: 72 },
              { label: "17:00", value: 68 },
              { label: "18:00", value: 64 },
              { label: "19:00", value: 61 }
            ],
            pareto: [
              { issue: "印刷偏位", count: 18 },
              { issue: "少锡", count: 16 },
              { issue: "立碑", count: 13 },
              { issue: "虚焊", count: 11 },
              { issue: "错件", count: 9 },
              { issue: "锡珠", count: 7 },
              { issue: "连锡", count: 6 }
            ]
          }
        ]
      },
      {
        id: "WO-240512-05",
        title: "服务器背板",
        products: [
          {
            product: "服务器背板",
            variant: "18层 · 高速互连",
            plan: 540,
            completion: 0.38,
            firstPass: 0.963,
            capacityToday: 310,
            shift: "夜班 20:00 - 08:00",
            workOrder: "WO-240512-05",
            process: "SMT 回流焊",
            line: "SMT-01 精密线",
            batch: "Lot#B2405-SRV",
            tempo: "92s tact",
            uphTrend: [
              { label: "20:00", value: 33 },
              { label: "21:00", value: 35 },
              { label: "22:00", value: 38 },
              { label: "23:00", value: 39 },
              { label: "00:00", value: 40 },
              { label: "01:00", value: 41 },
              { label: "02:00", value: 42 },
              { label: "03:00", value: 40 },
              { label: "04:00", value: 38 },
              { label: "05:00", value: 37 },
              { label: "06:00", value: 36 },
              { label: "07:00", value: 34 }
            ],
            pareto: [
              { issue: "少锡", count: 21 },
              { issue: "虚焊", count: 16 },
              { issue: "连锡", count: 15 },
              { issue: "翘脚", count: 12 },
              { issue: "偏移", count: 9 },
              { issue: "立碑", count: 7 },
              { issue: "错件", count: 5 }
            ]
          }
        ]
      }
    ]
  },
  {
    process: "DIP 波峰焊",
    orders: [
      {
        id: "WO-240513-03",
        title: "汽车控制器",
        products: [
          {
            product: "动力域控制器",
            variant: "车规级 · 防护 conformal coating",
            plan: 960,
            completion: 0.61,
            firstPass: 0.978,
            capacityToday: 590,
            shift: "白班 08:00 - 20:00",
            workOrder: "WO-240513-03",
            process: "DIP 波峰焊",
            line: "DIP-03 自动线",
            batch: "Lot#B2405-DIP",
            tempo: "68s tact",
            uphTrend: [
              { label: "08:00", value: 60 },
              { label: "09:00", value: 64 },
              { label: "10:00", value: 66 },
              { label: "11:00", value: 67 },
              { label: "12:00", value: 65 },
              { label: "13:00", value: 69 },
              { label: "14:00", value: 72 },
              { label: "15:00", value: 74 },
              { label: "16:00", value: 73 },
              { label: "17:00", value: 70 },
              { label: "18:00", value: 68 },
              { label: "19:00", value: 66 }
            ],
            pareto: [
              { issue: "脚长不够", count: 17 },
              { issue: "少焊", count: 15 },
              { issue: "桥连", count: 13 },
              { issue: "插反", count: 9 },
              { issue: "漏件", count: 8 },
              { issue: "位置偏移", count: 7 },
              { issue: "铜箔翘起", count: 5 }
            ]
          }
        ]
      }
    ]
  }
]);

const selectionVisible = ref(false);
const paretoRef = ref<HTMLDivElement>();
const uphRef = ref<HTMLDivElement>();
let paretoChart: echarts.ECharts | null = null;
let uphChart: echarts.ECharts | null = null;

const selectedProcess = ref(mockData[0].process);
const selectedOrder = ref(mockData[0].orders[0].id);
const selectedProduct = ref(mockData[0].orders[0].products[0].product);
const isFullscreen = ref(false);
const handleFullscreenChange = () => {
  isFullscreen.value = Boolean(document.fullscreenElement);
};

const processOptions = computed(() => mockData.map(item => item.process));
const orderOptions = computed(() => {
  const target = mockData.find(item => item.process === selectedProcess.value);
  return target?.orders || [];
});

const productOptions = computed(() => {
  const target = orderOptions.value.find(order => order.id === selectedOrder.value);
  return target?.products.map(item => item.product) || [];
});

const currentProductData = computed(() => {
  const process = mockData.find(item => item.process === selectedProcess.value);
  const order = process?.orders.find(item => item.id === selectedOrder.value);
  const product = order?.products.find(item => item.product === selectedProduct.value);
  return (
    product || {
      product: "-",
      variant: "-",
      plan: 0,
      completion: 0,
      firstPass: 0,
      capacityToday: 0,
      shift: "-",
      workOrder: selectedOrder.value,
      process: selectedProcess.value,
      line: "-",
      batch: "-",
      tempo: "-",
      uphTrend: [],
      pareto: []
    }
  );
});

const completionPercent = computed(() => Math.round(currentProductData.value.completion * 100));
const firstPassPercent = computed(() => Math.round(currentProductData.value.firstPass * 1000) / 10);
const latestUph = computed(() => currentProductData.value.uphTrend.at(-1)?.value ?? 0);

function applySelection() {
  if (!selectedProcess.value || !selectedOrder.value || !selectedProduct.value) {
    ElMessage.warning("请选择完整选项");
    return;
  }
  selectionVisible.value = false;
  ElMessage.success("看板已切换为最新组合");
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function buildParetoChart() {
  if (!paretoRef.value) return;
  if (!paretoChart) {
    paretoChart = echarts.init(paretoRef.value);
  }
  const data = currentProductData.value.pareto;
  const labels = data.map(item => item.issue);
  const counts = data.map(item => item.count);
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  const cumulative: number[] = [];
  counts.reduce((acc, cur) => {
    const next = acc + cur;
    cumulative.push(Math.round((next / total) * 100));
    return next;
  }, 0);

  paretoChart.setOption({
    backgroundColor: "transparent",
    grid: { left: 60, right: 60, top: 40, bottom: 40 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: [
      {
        type: "category",
        data: labels,
        axisLabel: { color: "#9cc8ff" },
        axisLine: { lineStyle: { color: "#2b80ff" } },
        axisTick: { show: false }
      }
    ],
    yAxis: [
      {
        type: "value",
        name: "缺陷数",
        axisLabel: { color: "#9cc8ff" },
        splitLine: { lineStyle: { color: "rgba(77,123,255,0.2)" } },
        axisLine: { lineStyle: { color: "#2b80ff" } }
      },
      {
        type: "value",
        name: "累计%",
        max: 100,
        axisLabel: { formatter: "{value}%", color: "#9cc8ff" },
        splitLine: { show: false },
        axisLine: { lineStyle: { color: "#2b80ff" } }
      }
    ],
    series: [
      {
        type: "bar",
        name: "缺陷数",
        data: counts,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#3af0ff" },
            { offset: 1, color: "#0544ff" }
          ]),
          shadowBlur: 16,
          shadowColor: "rgba(0,255,255,0.35)"
        },
        barWidth: 26,
        emphasis: { focus: "series" }
      },
      {
        type: "line",
        name: "累计占比",
        yAxisIndex: 1,
        data: cumulative,
        smooth: true,
        symbol: "circle",
        symbolSize: 10,
        itemStyle: { color: "#ffb547" },
        lineStyle: { width: 3, color: "#ffb547" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(255,181,71,0.32)" },
            { offset: 1, color: "rgba(255,181,71,0.05)" }
          ])
        }
      }
    ]
  });
}

function buildUphChart() {
  if (!uphRef.value) return;
  if (!uphChart) {
    uphChart = echarts.init(uphRef.value);
  }
  const data = currentProductData.value.uphTrend;
  const labels = data.map(item => item.label);
  const values = data.map(item => item.value);

  uphChart.setOption({
    backgroundColor: "transparent",
    grid: { left: 50, right: 40, top: 40, bottom: 40 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: labels,
      boundaryGap: false,
      axisLabel: { color: "#9cc8ff" },
      axisLine: { lineStyle: { color: "#2b80ff" } },
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#9cc8ff" },
      splitLine: { lineStyle: { color: "rgba(77,123,255,0.2)" } },
      axisLine: { lineStyle: { color: "#2b80ff" } }
    },
    series: [
      {
        type: "line",
        data: values,
        smooth: true,
        symbol: "circle",
        symbolSize: 10,
        lineStyle: { width: 4, color: "#39ff14" },
        itemStyle: {
          color: "#39ff14",
          shadowBlur: 20,
          shadowColor: "rgba(57,255,20,0.6)"
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(57,255,20,0.35)" },
            { offset: 1, color: "rgba(57,255,20,0.05)" }
          ])
        }
      }
    ]
  });
}

watch(currentProductData, () => {
  buildParetoChart();
  buildUphChart();
});

watch(selectedProcess, () => {
  selectedOrder.value = orderOptions.value[0]?.id || "";
});

watch(selectedOrder, () => {
  selectedProduct.value = productOptions.value[0] || "";
});

onMounted(() => {
  buildParetoChart();
  buildUphChart();
  document.addEventListener("fullscreenchange", handleFullscreenChange);
});

onBeforeUnmount(() => {
  paretoChart?.dispose();
  uphChart?.dispose();
  document.removeEventListener("fullscreenchange", handleFullscreenChange);
});
</script>

<style scoped lang="scss">
.neo-screen {
  position: relative;
  min-height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: radial-gradient(circle at 20% 20%, rgba(0, 200, 255, 0.08), transparent 25%),
    radial-gradient(circle at 80% 10%, rgba(255, 0, 255, 0.06), transparent 30%),
    radial-gradient(circle at 60% 60%, rgba(0, 255, 135, 0.08), transparent 35%),
    linear-gradient(135deg, #040915, #050d1d 50%, #031133);
  color: #e5f1ff;
  font-family: "JetBrains Mono", "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.neo-screen.fullscreen {
  padding: 0;
}

.content-shell {
  position: relative;
  padding: 32px 36px 48px;
  z-index: 2;
}

.grid-overlay {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(0, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 160px 160px, 160px 160px;
  opacity: 0.35;
  filter: blur(0.2px);
  z-index: 0;
}

.scanline {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0, 255, 255, 0.03),
    rgba(0, 255, 255, 0.03) 2px,
    transparent 2px,
    transparent 4px
  );
  mix-blend-mode: screen;
  opacity: 0.2;
  z-index: 1;
}

.screen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 12px;
}

.title {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 0.06em;
  margin: 4px 0;
  color: #8be9ff;
  text-shadow: 0 0 16px rgba(0, 255, 255, 0.55);
}

.eyebrow {
  color: #6dc8ff;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 12px;
}

.meta-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 999px;
  background: rgba(9, 42, 68, 0.5);
  color: #bfe7ff;
  font-size: 12px;
  text-transform: uppercase;
}

.action-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.ghost-btn {
  background: rgba(8, 31, 56, 0.7);
  border: 1px solid rgba(0, 255, 255, 0.35);
  color: #8bd3ff;
}

.primary-btn {
  background: linear-gradient(135deg, #00f0ff, #0060ff);
  border: none;
  color: #001123;
  font-weight: 700;
  box-shadow: 0 8px 40px rgba(0, 170, 255, 0.45);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.metric-card {
  padding: 16px 18px;
  background: radial-gradient(circle at 20% 20%, rgba(0, 255, 255, 0.08), transparent 45%),
    linear-gradient(135deg, rgba(18, 54, 92, 0.8), rgba(8, 20, 45, 0.8));
  border: 1px solid rgba(61, 119, 255, 0.4);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.28);
  border-radius: 14px;
  backdrop-filter: blur(6px);
}

.metric-card.highlight {
  border-color: rgba(0, 255, 255, 0.7);
  box-shadow: 0 0 25px rgba(0, 255, 255, 0.25);
}

.label {
  color: #7fbfff;
  font-size: 13px;
  letter-spacing: 0.04em;
}

.value {
  font-size: 26px;
  font-weight: 800;
  margin: 6px 0;
  color: #f5fcff;
}

.hint {
  color: #7a98c5;
  font-size: 12px;
}

.progress {
  position: relative;
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  overflow: hidden;
  margin: 8px 0 4px;
}

.progress-bar {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #19f0ff, #2667ff, #4a00ff);
  box-shadow: 0 0 18px rgba(0, 255, 255, 0.4);
}

.charts {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 16px;
}

.chart-card {
  background: linear-gradient(145deg, rgba(13, 30, 60, 0.9), rgba(5, 12, 30, 0.9));
  border: 1px solid rgba(0, 153, 255, 0.4);
  box-shadow: 0 10px 45px rgba(0, 0, 0, 0.3);
  border-radius: 18px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-body {
  width: 100%;
  height: 320px;
}

.selection-dialog :deep(.el-dialog__body) {
  padding-top: 12px;
}

.selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.selection-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:deep(.el-select),
:deep(.el-input__inner) {
  background: rgba(8, 31, 56, 0.7);
  border-color: rgba(0, 255, 255, 0.35);
  color: #cbe6ff;
}

:deep(.el-select-dropdown__item) {
  color: #0e1a2d;
}

@media (max-width: 960px) {
  .screen-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-group {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
