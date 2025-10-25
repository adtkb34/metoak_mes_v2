<template>
  <div class="dashboard-page space-y-4">
    <el-card shadow="never">
      <filters-panel
        :date-range="filters.dateRange"
        :product="filters.product"
        :origin="filters.origin"
        :product-options="productOptions"
        :process-options="processOptions"
        :process-steps="filters.steps"
        :origin-options="originOptions"
        :loading="filtersLoading"
        @update:dateRange="value => (filters.dateRange = value)"
        @update:product="value => (filters.product = value)"
        @update:origin="value => (filters.origin = value)"
        @update:processSteps="value => (filters.steps = value)"
        @submit="handleFiltersSubmit"
        @reset="handleFiltersReset"
      />
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-base font-medium text-gray-700">
            {{ headerTitle }}
          </span>
          <el-button
            v-if="isDetailVisible"
            link
            type="primary"
            @click="handleBackToOverview"
          >
            返回工序概览
          </el-button>
        </div>
      </template>
      <el-alert
        v-if="isDetailVisible && detailError"
        class="mb-4"
        type="error"
        :closable="false"
        show-icon
        :title="detailError"
      />
      <el-alert
        v-else-if="!isDetailVisible && summaryError"
        class="mb-4"
        type="error"
        :closable="false"
        show-icon
        :title="summaryError"
      />
      <process-detail
        v-if="isDetailVisible"
        :detail="processDetail"
        :loading="detailLoading"
      />
      <process-overview
        v-else
        :processes="processes"
        :loading="overviewLoading"
        @select="handleProcessSelect"
      />
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-base font-medium text-gray-700">在制工单</span>
          <el-tag type="info" effect="plain">
            共 {{ workOrders.length }} 条
          </el-tag>
        </div>
      </template>
      <work-orders-table :work-orders="workOrders" :loading="overviewLoading" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import dayjs from "dayjs";
import { ElMessage } from "element-plus";
import FiltersPanel from "./components/FiltersPanel.vue";
import ProcessOverview from "./components/ProcessOverview.vue";
import ProcessDetail from "./components/ProcessDetail.vue";
import WorkOrdersTable from "./components/WorkOrdersTable.vue";
import type {
  FilterState,
  ProcessDetailData,
  ProcessMetricsSummary,
  ProcessOverviewItem,
  SelectOption,
  WorkOrderRow
} from "./types";
import {
  fetchDashboardSummary,
  fetchProcessDetail,
  fetchDashboardProducts,
  fetchProcessMetrics
} from "@/api/dashboard";
import type { DashboardSummaryParams } from "@/api/dashboard";
import { PRODUCT_ORIGIN_OPTIONS, ProductOrigin } from "@/enums/product-origin";

const getDefaultDateRange = (): string[] => {
  const today = dayjs().format("YYYY-MM-DD");
  return [today, today];
};

const DEFAULT_PROCESS_STEPS = ["002", "020", "027"];

const PROCESS_STEP_OPTIONS: SelectOption[] = [
  { label: "AA 自动调校", value: "002" },
  { label: "标定", value: "020" },
  { label: "S315FQC", value: "027" },
  { label: "PCBA 组装", value: "029" }
];

const createEmptyProcessMetricsSummary = (): ProcessMetricsSummary => ({
  数量: { 良品: "-", 产品: "-", 执行: "-" },
  良率: { 一次良率: "-", 最终良率: "-", 产品良率: "-" },
  良品用时: { mean: "-", min: "-", max: "-" }
});

const filters = reactive<FilterState>({
  dateRange: getDefaultDateRange(),
  product: null,
  origin: ProductOrigin.Suzhou,
  steps: [...DEFAULT_PROCESS_STEPS]
});

const productOptions = ref<SelectOption[]>([]);
const processOptions = ref<SelectOption[]>(
  PROCESS_STEP_OPTIONS.map(option => ({ ...option }))
);
const originOptions = ref<SelectOption[]>(
  PRODUCT_ORIGIN_OPTIONS.map(option => ({ ...option }))
);
const processMetricsMap = ref<Record<string, ProcessMetricsSummary>>({});
const workOrders = ref<WorkOrderRow[]>([]);

const overviewLoading = ref(false);
const detailLoading = ref(false);
const summaryError = ref<string | null>(null);
const detailError = ref<string | null>(null);

const selectedProcessId = ref<string | null>(null);
const processDetail = ref<ProcessDetailData | null>(null);

const getProcessLabel = (step: string): string => {
  const match = PROCESS_STEP_OPTIONS.find(option => option.value === step);
  return match?.label ?? step;
};

const buildEmptyMetricsMap = (
  steps: string[]
): Record<string, ProcessMetricsSummary> => {
  return steps.reduce<Record<string, ProcessMetricsSummary>>((acc, step) => {
    acc[step] = createEmptyProcessMetricsSummary();
    return acc;
  }, {});
};

const hasMeaningfulMetrics = (summary: ProcessMetricsSummary): boolean => {
  const values = [
    summary.数量.良品,
    summary.数量.产品,
    summary.数量.执行,
    summary.良率.一次良率,
    summary.良率.最终良率,
    summary.良率.产品良率,
    summary.良品用时.mean,
    summary.良品用时.min,
    summary.良品用时.max
  ];

  return values.some(value => typeof value === "number");
};

const activeProcessSteps = computed<string[]>(() =>
  filters.steps.length ? [...filters.steps] : [...DEFAULT_PROCESS_STEPS]
);

processMetricsMap.value = buildEmptyMetricsMap(activeProcessSteps.value);

const processes = computed<ProcessOverviewItem[]>(() =>
  activeProcessSteps.value.map(step => ({
    id: step,
    name: getProcessLabel(step),
    metrics: processMetricsMap.value[step] ?? createEmptyProcessMetricsSummary()
  }))
);

const isDetailVisible = computed(() => selectedProcessId.value !== null);
const filtersLoading = computed(
  () => overviewLoading.value || detailLoading.value
);

const selectedProcessName = computed(() => {
  if (!selectedProcessId.value) return "";
  if (processDetail.value?.processName) return processDetail.value.processName;
  return getProcessLabel(selectedProcessId.value);
});

const headerTitle = computed(() =>
  isDetailVisible.value ? `${selectedProcessName.value} 工序详情` : "工序概览"
);

let productOptionsRequestToken = 0;

const resetProductSelection = () => {
  productOptionsRequestToken++;
  productOptions.value = [];
  if (filters.product) {
    filters.product = null;
  }
};

const refreshProductOptions = async () => {
  const hasValidRange = filters.dateRange.length === 2;
  const selectedOrigin = filters.origin ?? undefined;

  if (!hasValidRange || selectedOrigin === undefined) {
    return;
  }

  const requestToken = ++productOptionsRequestToken;

  try {
    const result = await fetchDashboardProducts({
      startDate: filters.dateRange[0],
      endDate: filters.dateRange[1],
      origin: selectedOrigin
    });

    if (requestToken !== productOptionsRequestToken) {
      return;
    }

    const nextProductOptions = result.map(item => ({
      label: item.label,
      value: item.code
    }));

    productOptions.value = nextProductOptions;

    if (
      filters.product &&
      !nextProductOptions.some(option => option.value === filters.product)
    ) {
      filters.product = null;
    }
  } catch (error: any) {
    if (requestToken !== productOptionsRequestToken) {
      return;
    }

    const message = error?.message ?? "获取产品选项失败";
    ElMessage.warning(message);
    productOptions.value = [];
    if (filters.product) {
      filters.product = null;
    }
  }
};

watch(
  () => filters.origin,
  () => {
    resetProductSelection();
    refreshProductOptions();
  }
);

watch(
  () => filters.dateRange.slice(),
  () => {
    refreshProductOptions();
  }
);

watch(
  () => filters.steps.slice(),
  steps => {
    const activeSteps = steps.length ? [...steps] : [...DEFAULT_PROCESS_STEPS];
    const nextMap = buildEmptyMetricsMap(activeSteps);
    for (const step of activeSteps) {
      if (processMetricsMap.value[step]) {
        nextMap[step] = processMetricsMap.value[step];
      }
    }
    processMetricsMap.value = nextMap;

    if (
      selectedProcessId.value &&
      !activeSteps.includes(selectedProcessId.value)
    ) {
      selectedProcessId.value = null;
      processDetail.value = null;
      detailError.value = null;
    }
  }
);

watch(
  () => filters.product,
  value => {
    if (!value) {
      processMetricsMap.value = buildEmptyMetricsMap(activeProcessSteps.value);
    }
  }
);

const buildSummaryParams = (): DashboardSummaryParams => {
  const hasRange = filters.dateRange.length === 2;
  return {
    startDate: hasRange ? filters.dateRange[0] : undefined,
    endDate: hasRange ? filters.dateRange[1] : undefined,
    product: filters.product,
    origin: filters.origin ?? undefined
  };
};

const refreshProcessMetrics = async (
  params: DashboardSummaryParams
): Promise<boolean> => {
  const steps = activeProcessSteps.value;
  const baseMap = buildEmptyMetricsMap(steps);
  processMetricsMap.value = baseMap;

  if (!params.product || !steps.length) {
    return false;
  }

  const requests = steps.map(step =>
    fetchProcessMetrics({
      startDate: params.startDate,
      endDate: params.endDate,
      origin: params.origin,
      product: params.product!,
      stepTypeNo: step
    }).then(summary => ({ step, summary }))
  );

  const results = await Promise.allSettled(requests);
  let hasData = false;
  const failedSteps: string[] = [];
  let firstErrorMessage: string | null = null;

  results.forEach((result, index) => {
    const step = steps[index];
    if (result.status === "fulfilled") {
      const summary = result.value.summary;
      baseMap[step] = summary;
      if (hasMeaningfulMetrics(summary)) {
        hasData = true;
      }
    } else {
      baseMap[step] = createEmptyProcessMetricsSummary();
      failedSteps.push(getProcessLabel(step));
      if (!firstErrorMessage) {
        const reason = result.reason as { message?: string } | undefined;
        firstErrorMessage = reason?.message ?? null;
      }
    }
  });

  processMetricsMap.value = baseMap;

  if (failedSteps.length) {
    const label = failedSteps.join("、");
    const message = firstErrorMessage
      ? `${label} 指标获取失败：${firstErrorMessage}`
      : `获取 ${label} 指标失败`;
    ElMessage.error(message);
  }

  return hasData;
};

const fetchSummary = async () => {
  overviewLoading.value = true;
  summaryError.value = null;
  try {
    const params = buildSummaryParams();
    const selectedOrigin = filters.origin ?? undefined;

    const shouldFetchProducts = Boolean(
      params.startDate && params.endDate && selectedOrigin !== undefined
    );
    const productOptionsPromise = shouldFetchProducts
      ? fetchDashboardProducts({
          startDate: params.startDate,
          endDate: params.endDate,
          origin: selectedOrigin
        }).catch((error: any) => {
          const message = error?.message ?? "获取产品选项失败";
          ElMessage.warning(message);
          return [];
        })
      : Promise.resolve([]);

    const result = await fetchDashboardSummary(params);
    const productOptionPayload = shouldFetchProducts
      ? await productOptionsPromise
      : [];

    const nextProductOptions = shouldFetchProducts
      ? productOptionPayload.length
        ? productOptionPayload.map(item => ({
            label: item.label,
            value: item.code
          }))
        : result.filters.products
      : [];

    productOptions.value = nextProductOptions;
    const availableProductCodes = new Set(
      nextProductOptions.map(item => item.value)
    );
    if (filters.product && !availableProductCodes.has(filters.product)) {
      filters.product = null;
    }

    originOptions.value = result.filters.origins.length
      ? result.filters.origins
      : PRODUCT_ORIGIN_OPTIONS.map(option => ({ ...option }));
    workOrders.value = result.workOrders;

    let metricsAvailable = false;
    if (params.product) {
      metricsAvailable = await refreshProcessMetrics(params);
    } else {
      processMetricsMap.value = buildEmptyMetricsMap(activeProcessSteps.value);
    }

    if (!metricsAvailable && !result.workOrders.length && params.product) {
      summaryError.value = "当前筛选条件没有匹配的数据";
    }
  } catch (error: any) {
    const message = error?.message ?? "获取仪表盘数据失败";
    summaryError.value = message;
    processMetricsMap.value = buildEmptyMetricsMap(activeProcessSteps.value);
    workOrders.value = [];
    ElMessage.error(message);
  } finally {
    overviewLoading.value = false;
  }
};

const handleProcessSelect = async (processId: string) => {
  if (detailLoading.value) return;
  selectedProcessId.value = processId;
  detailLoading.value = true;
  detailError.value = null;
  processDetail.value = null;
  try {
    const params = buildSummaryParams();
    const result = await fetchProcessDetail({
      ...params,
      processId,
      stepTypeNo: processId
    });
    processDetail.value = result;
  } catch (error: any) {
    const message = error?.message ?? "获取工序详情失败";
    detailError.value = message;
    ElMessage.error(message);
  } finally {
    detailLoading.value = false;
  }
};

const handleBackToOverview = () => {
  selectedProcessId.value = null;
  processDetail.value = null;
  detailError.value = null;
};

const handleFiltersSubmit = () => {
  selectedProcessId.value = null;
  processDetail.value = null;
  detailError.value = null;
  fetchSummary();
};

const handleFiltersReset = () => {
  filters.dateRange = getDefaultDateRange();
  filters.product = null;
  filters.origin = ProductOrigin.Suzhou;
  filters.steps = [...DEFAULT_PROCESS_STEPS];
  handleFiltersSubmit();
};

onMounted(() => {
  fetchSummary();
});
</script>

<style scoped>
.dashboard-page {
  padding-bottom: 24px;
}
</style>
