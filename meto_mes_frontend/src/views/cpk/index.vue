<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import * as echarts from "echarts";

// 输入数据
const rawData =
  "54.35, 55.35,57.35, 58.35,59.35,60.37,61.29, 59.35,59.35,59.35,59.35,59.35,28.9, 40.64, 60.42, 47.45, 39.21, 28.13, 44.49, 46.7, 55.52, 53.5, 39.65, 51.92, 49.91, 37.79, 57.72, 41.25, 58.83, 44.59, 47.65, 66.45, 53.7, 74.22, 33.97, 41.09, 54.5, 56.98, 49.84, 65.5, 44.33, 45.35, 57.23, 59.57, 59.31";
const data = rawData.split(",").filter(Boolean).map(Number);

const usl = ref(65);
const lsl = ref(35);
const rule = ref("rule_1");
const avg = ref(0);
avg.value = data.reduce((a, b) => a + b) / data.length;

const chartDom = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

function detectAnomalies(): number[] {
  const result: number[] = [];

  switch (rule.value) {
    case "rule_1": // 超限
      data.forEach((v, i) => {
        if (v > usl.value || v < lsl.value) result.push(i);
      });
      break;
    case "rule_2": // 连续6点上升或下降
      for (let i = 0; i <= data.length - 6; i++) {
        const slice = data.slice(i, i + 6);
        const increasing = slice.every((v, j, a) => j === 0 || a[j] > a[j - 1]);
        const decreasing = slice.every((v, j, a) => j === 0 || a[j] < a[j - 1]);
        if (increasing || decreasing) {
          result.push(...Array.from({ length: 6 }, (_, k) => i + k));
          i += 5; // skip overlapping
        }
      }
      break;
    case "rule_3": // 连续9点在均值一侧
      for (let i = 0; i <= data.length - 9; i++) {
        const side = data[i] > avg.value;
        if (data.slice(i, i + 9).every(d => d > avg.value === side)) {
          result.push(...Array.from({ length: 9 }, (_, k) => i + k));
          i += 8;
        }
      }
      break;
  }

  return Array.from(new Set(result)).sort((a, b) => a - b);
}

function renderChart() {
  if (!chartDom.value) return;
  if (!chartInstance) chartInstance = echarts.init(chartDom.value);

  const abnormalSet = new Set(detectAnomalies());

  chartInstance.setOption({
    title: {
      text: `CPK 折线图 - ${ruleLabel.value}`,
      left: "center"
    },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: data.map((_, i) => i + 1) },
    yAxis: { type: "value" },
    series: [
      {
        name: "值",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        data: data.map((v, i) => ({
          value: v,
          itemStyle: {
            color: abnormalSet.has(i) ? "red" : "#409EFF"
          }
        })),
        lineStyle: { color: "#409EFF" },
        markLine: {
          symbol: "none",
          label: {
            show: true,
            position: "end",
            formatter: params => {
              if (params.name === "USL") return `USL: ${params.value}`;
              if (params.name === "LSL") return `LSL: ${params.value}`;
              if (params.name === "均值") return `均值: ${params.value}`;
              return `${params.name}: ${params.value}`;
            },
            color: "#000"
          },
          lineStyle: {
            type: "dashed",
            color: "gray"
          },
          data: [
            {
              yAxis: usl.value,
              name: "USL",
              lineStyle: { color: "red" }
            },
            {
              yAxis: lsl.value,
              name: "LSL",
              lineStyle: { color: "green" }
            },
            {
              yAxis: avg.value,
              name: "均值",
              lineStyle: { color: "#FFA500" }, // 橙色
              label: {
                formatter: "均值: {c}",
                position: "end",
                color: "#FFA500"
              }
            }
          ]
        }
      }
    ]
  });
}

watch([usl, lsl, rule], renderChart, { immediate: true });
onMounted(renderChart);

const ruleOptions = [
  { label: "1点超 USL/LSL", value: "rule_1" },
  { label: "连续6点上升/下降", value: "rule_2" },
  { label: "连续9点在均值一侧", value: "rule_3" }
];
const ruleLabel = ref(
  ruleOptions.find(r => r.value === rule.value)?.label || ""
);
watch(rule, val => {
  ruleLabel.value = ruleOptions.find(r => r.value === val)?.label || "";
});
</script>

<template>
  <div style="padding: 20px">
    <el-form inline label-width="100px" size="small">
      <el-form-item label="USL">
        <el-input-number v-model="usl" :min="0" />
      </el-form-item>
      <el-form-item label="LSL">
        <el-input-number v-model="lsl" :min="0" />
      </el-form-item>
      <el-form-item label="异常规则">
        <el-select v-model="rule" placeholder="选择规则" style="width: 200px">
          <el-option
            v-for="r in ruleOptions"
            :key="r.value"
            :label="r.label"
            :value="r.value"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <div ref="chartDom" style="width: 100%; height: 400px; margin-top: 20px" />
  </div>
</template>
