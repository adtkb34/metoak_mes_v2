<template>
  <div class="process-detail">
    <el-skeleton v-if="loading" animated :rows="6" />
    <template v-else>
      <el-empty v-if="!detail || !detail.rows.length" description="暂无数据" />
      <template v-else>
        <el-form
          :inline="true"
          label-width="80px"
          class="mb-4 flex flex-wrap items-center gap-4"
        >
          <!-- <el-form-item label="设备">
            <el-select
              class="w-56"
              multiple
              clearable
              filterable
              collapse-tags
              collapse-tags-tooltip
              placeholder="选择设备"
              :model-value="selectedEquipment"
              @update:model-value="
                value => (selectedEquipment.value = value ?? [])
              "
            >
              <el-option
                v-for="item in detail.equipmentOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="工站">
            <el-select
              class="w-56"
              multiple
              clearable
              filterable
              collapse-tags
              collapse-tags-tooltip
              placeholder="选择工站"
              :model-value="selectedStations"
              @update:model-value="
                value => (selectedStations.value = value ?? [])
              "
            >
              <el-option
                v-for="item in detail.stationOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item> -->
          <!-- <el-form-item label="视图">
            <el-switch
              v-model="displayMode"
              inline-prompt
              active-text="统计"
              inactive-text="详情"
              active-value="statistics"
              inactive-value="detail"
            />
          </el-form-item> -->
        </el-form>

        <div v-if="displayMode === 'statistics'" class="space-y-6">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div class="stat-card">
              <div class="text-gray-400">产量</div>
              <div class="mt-2 text-2xl font-semibold text-gray-700">
                {{ formatNumber(summary.totalOutput) }}
              </div>
            </div>
            <div class="stat-card">
              <div class="text-gray-400">一次良率</div>
              <div class="mt-2 text-2xl font-semibold text-emerald-600">
                {{ formatPercent(summary.firstPassRate) }}
              </div>
            </div>
            <div class="stat-card">
              <div class="text-gray-400">最终良率</div>
              <div class="mt-2 text-2xl font-semibold text-blue-600">
                {{ formatPercent(summary.finalPassRate) }}
              </div>
            </div>
            <div class="stat-card">
              <div class="text-gray-400">返修 / 报废</div>
              <div class="mt-2 text-lg font-semibold text-amber-600">
                {{ formatNumber(summary.reworkCount) }} /
                {{ formatNumber(summary.scrapCount) }}
              </div>
            </div>
          </div>

          <div class="pareto-card">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="text-base font-medium text-gray-700">柏拉图</h3>
              <span class="text-xs text-gray-400"
                >累计占比 80% 对应的缺陷集中度</span
              >
            </div>
            <el-empty
              v-if="!paretoData.categories.length"
              description="暂无缺陷数据"
            />
            <v-chart
              v-else
              class="h-[320px]"
              :option="chartOption"
              autoresize
            />
          </div>
        </div>

        <div v-else>
          <el-table :data="filteredRows" stripe style="width: 100%">
            <el-table-column prop="date" label="日期" width="110" />
            <el-table-column
              prop="batch"
              label="批次"
              width="160"
              show-overflow-tooltip
            />
            <el-table-column prop="product" label="产品" width="110" />
            <el-table-column label="产地" width="110">
              <template #default="{ row }">
                {{ getProductOriginLabel(row.origin) }}
              </template>
            </el-table-column>
            <el-table-column prop="equipment" label="设备" width="110" />
            <el-table-column prop="station" label="工站" width="120" />
            <el-table-column label="产量" width="100">
              <template #default="{ row }">
                {{ formatNumber(row.output) }}
              </template>
            </el-table-column>
            <el-table-column label="一次良率" width="120">
              <template #default="{ row }">
                {{ formatPercent(row.firstPassRate) }}
              </template>
            </el-table-column>
            <el-table-column label="最终良率" width="120">
              <template #default="{ row }">
                {{ formatPercent(row.finalPassRate) }}
              </template>
            </el-table-column>
            <el-table-column label="返修 / 报废" width="140">
              <template #default="{ row }">
                {{ formatNumber(row.reworkCount) }} /
                {{ formatNumber(row.scrapCount) }}
              </template>
            </el-table-column>
            <el-table-column label="主要缺陷">
              <template #default="{ row }">
                <div class="flex flex-wrap gap-2">
                  <el-tag
                    v-for="defect in row.defects"
                    :key="defect.reason"
                    size="small"
                    type="info"
                  >
                    {{ defect.reason }}: {{ defect.count }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { use } from "echarts/core";
import VChart from "vue-echarts";
import { BarChart, LineChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { getProductOriginLabel } from "@/enums/product-origin";
import type {
  DefectBreakdown,
  ProcessDetailData,
  ProcessDetailRow
} from "../types";

use([
  BarChart,
  LineChart,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer
]);

interface Props {
  detail: ProcessDetailData | null;
  loading?: boolean;
}

const props = defineProps<Props>();

const displayMode = ref<"statistics" | "detail">("statistics");
const selectedEquipment = ref<string[]>([]);
const selectedStations = ref<string[]>([]);

watch(
  () => props.detail,
  () => {
    selectedEquipment.value = [];
    selectedStations.value = [];
    displayMode.value = "statistics";
  }
);

const filteredRows = computed<ProcessDetailRow[]>(() => {
  if (!props.detail) return [];
  return props.detail.rows.filter(row => {
    const equipmentMatched =
      !selectedEquipment.value.length ||
      selectedEquipment.value.includes(row.equipment);
    const stationMatched =
      !selectedStations.value.length ||
      selectedStations.value.includes(row.station);
    return equipmentMatched && stationMatched;
  });
});

const summary = computed(() => {
  const rows = filteredRows.value;
  const totalOutput = rows.reduce((sum, row) => sum + row.output, 0);
  const firstPass = rows.reduce(
    (sum, row) => sum + row.output * row.firstPassRate,
    0
  );
  const finalPass = rows.reduce(
    (sum, row) => sum + row.output * row.finalPassRate,
    0
  );
  const scrap = rows.reduce((sum, row) => sum + row.scrapCount, 0);
  const rework = rows.reduce((sum, row) => sum + row.reworkCount, 0);
  return {
    totalOutput,
    firstPassRate: totalOutput ? firstPass / totalOutput : 0,
    finalPassRate: totalOutput ? finalPass / totalOutput : 0,
    scrapCount: scrap,
    reworkCount: rework
  };
});

const buildPareto = (rows: ProcessDetailRow[]) => {
  const map = new Map<string, number>();
  rows.forEach(row => {
    row.defects.forEach((defect: DefectBreakdown) => {
      map.set(defect.reason, (map.get(defect.reason) ?? 0) + defect.count);
    });
  });
  const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((sum, [, count]) => sum + count, 0);
  let cumulative = 0;
  return {
    categories: sorted.map(([reason]) => reason),
    counts: sorted.map(([, count]) => count),
    cumulative: sorted.map(([, count]) => {
      cumulative += count;
      return total ? Number(((cumulative / total) * 100).toFixed(1)) : 0;
    })
  };
};

const paretoData = computed(() => buildPareto(filteredRows.value));

const chartOption = computed(() => {
  if (!paretoData.value.categories.length) {
    return {};
  }
  return {
    tooltip: {
      trigger: "axis"
    },
    legend: {
      data: ["不良数", "累计占比"]
    },
    grid: {
      top: 50,
      left: "6%",
      right: "8%",
      bottom: 30
    },
    xAxis: {
      type: "category",
      data: paretoData.value.categories,
      axisLabel: {
        interval: 0,
        rotate: 20
      }
    },
    yAxis: [
      {
        type: "value",
        name: "不良数",
        minInterval: 1
      },
      {
        type: "value",
        name: "累计占比",
        min: 0,
        max: 100,
        axisLabel: {
          formatter: "{value}%"
        }
      }
    ],
    series: [
      {
        name: "不良数",
        type: "bar",
        data: paretoData.value.counts,
        itemStyle: {
          color: "#409EFF"
        }
      },
      {
        name: "累计占比",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        data: paretoData.value.cumulative,
        itemStyle: {
          color: "#F56C6C"
        }
      }
    ]
  };
});

const numberFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 0
});

const formatNumber = (value: number) => numberFormatter.format(value);
const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
</script>

<style scoped>
.stat-card {
  @apply rounded-lg border border-gray-200 bg-white p-4 shadow-sm;
}

.pareto-card {
  @apply rounded-lg border border-gray-200 bg-white p-4 shadow-sm;
}
</style>
