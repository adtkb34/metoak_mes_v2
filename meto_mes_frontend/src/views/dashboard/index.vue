<template>
  <div class="dashboard-page space-y-4">
    <el-card shadow="never">
      <filters-panel
        :date-range="filters.dateRange"
        :product="filters.product"
        :origin="filters.origin"
        :product-options="productOptions"
        :process-options="processOptions"
        :process-code="filters.processCode"
        :origin-options="originOptions"
        :loading="filtersLoading"
        @update:dateRange="value => (filters.dateRange = value)"
        @update:product="value => (filters.product = value)"
        @update:origin="value => (filters.origin = value)"
        @update:processCode="value => (filters.processCode = value)"
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
        :metrics="selectedProcessMetrics"
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
  fetchProcessDetail,
  fetchDashboardProducts,
  fetchProcessMetrics
} from "@/api/dashboard";
import type { DashboardSummaryParams } from "@/api/dashboard";
import { PRODUCT_ORIGIN_OPTIONS, ProductOrigin } from "@/enums/product-origin";
import { STEP_NO } from "@/enums/step-no";
import { useProcessStore } from "@/store/modules/processFlow";
import type { ProcessFlow, ProcessFlowSteps } from "@/api/processFlow";

const getDefaultDateRange = (): string[] => {
  const today = dayjs().format("YYYY-MM-DD");
  return [today, today];
};

const DEFAULT_STEP_TYPE_NOS: string[] = [
  STEP_NO.AUTO_ADJUST,
  STEP_NO.CALIB,
  STEP_NO.S315FQC
];

const createEmptyProcessMetricsSummary = (): ProcessMetricsSummary => ({
  数量: { 良品: "-", 产品: "-", 总体: "-" },
  良率: { 一次: "-", 最终: "-", 总体: "-" },
  良品用时: { mean: "-", min: "-", max: "-" }
});

const filters = reactive<FilterState>({
  dateRange: getDefaultDateRange(),
  product: null,
  origin: ProductOrigin.Suzhou,
  processCode: null
});

const processStore = useProcessStore();

const productOptions = ref<SelectOption[]>([]);
const processOptions = computed<SelectOption[]>(() => {
  const list = (processStore.processFlow.list ?? []) as ProcessFlow[];
  if (!Array.isArray(list)) return [];
  return list.map(flow => {
    const name = flow.process_name?.trim?.();
    const label =
      name && name.length > 0
        ? `${flow.process_code} (${name})`
        : flow.process_code;
    return {
      label,
      value: flow.process_code
    } as SelectOption;
  });
});
const originOptions = ref<SelectOption[]>(
  PRODUCT_ORIGIN_OPTIONS.map(option => ({ ...option }))
);
const processStages = computed<ProcessFlowSteps[]>(
  () => (processStore.processStages.stages ?? []) as ProcessFlowSteps[]
);
const stageMapByCode = computed(() => {
  const map = new Map<string, ProcessFlowSteps>();
  processStages.value.forEach(stage => {
    if (stage?.stage_code) {
      map.set(stage.stage_code, stage);
    }
  });
  return map;
});
const stepLabelMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {};
  processStages.value.forEach(stage => {
    const stepNo = stage?.step_type_no?.trim?.();
    if (!stepNo) {
      return;
    }
    const stageName = stage?.stage_name?.trim?.();
    map[stepNo] = stageName && stageName.length > 0 ? stageName : stepNo;
  });
  return map;
});
const processMetricsMap = ref<Record<string, ProcessMetricsSummary>>({});
const workOrders = ref<WorkOrderRow[]>([]);

const overviewLoading = ref(false);
const detailLoading = ref(false);
const summaryError = ref<string | null>(null);
const detailError = ref<string | null>(null);

const selectedProcessId = ref<string | null>(null);
const processDetail = ref<ProcessDetailData | null>(null);

const getProcessLabel = (step: string): string => {
  const label = stepLabelMap.value[step];
  return label ?? step;
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
    summary.数量.总体,
    summary.良率.一次,
    summary.良率.最终,
    summary.良率.总体,
    summary.良品用时.mean,
    summary.良品用时.min,
    summary.良品用时.max
  ];

  return values.some(value => typeof value === "number");
};

const deriveStepTypeNosFromProcessCode = (code: string | null): string[] => {
  if (!code) {
    return [];
  }

  const flows = (processStore.processFlow.list ?? []) as ProcessFlow[];
  if (!Array.isArray(flows) || flows.length === 0) {
    return [];
  }

  const flow = flows.find(item => item.process_code === code);
  if (!flow) {
    return [];
  }

  const stageCodes = Array.isArray(flow.stage_codes) ? flow.stage_codes : [];
  if (!stageCodes.length) {
    return [];
  }

  const stageMap = stageMapByCode.value;
  return stageCodes
    .map(stageCode => stageMap.get(stageCode)?.step_type_no?.trim?.())
    .filter((step): step is string => !!step);
};

const activeProcessSteps = ref<string[]>([...DEFAULT_STEP_TYPE_NOS]);

const setActiveProcessSteps = (
  steps: string[],
  options: { fallbackToDefault?: boolean } = {}
) => {
  const normalizedSteps = steps
    .map(step => step?.trim?.())
    .filter((step): step is string => !!step);
  const uniqueSteps = Array.from(new Set(normalizedSteps));

  if (uniqueSteps.length) {
    activeProcessSteps.value = uniqueSteps;
    return;
  }

  if (options.fallbackToDefault !== false) {
    activeProcessSteps.value = [...DEFAULT_STEP_TYPE_NOS];
  } else {
    activeProcessSteps.value = [];
  }
};

const syncProcessStepsWithSelection = () => {
  if (!filters.processCode) {
    setActiveProcessSteps([], { fallbackToDefault: true });
    return;
  }

  const derived = deriveStepTypeNosFromProcessCode(filters.processCode);
  setActiveProcessSteps(derived, { fallbackToDefault: false });
};

processMetricsMap.value = {
  ...buildEmptyMetricsMap(activeProcessSteps.value)
};

const processes = computed<ProcessOverviewItem[]>(() =>
  activeProcessSteps.value.map(step => ({
    id: step,
    name: getProcessLabel(step),
    metrics:
      processMetricsMap.value[step] ?? createEmptyProcessMetricsSummary()
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

const selectedProcessMetrics = computed<ProcessMetricsSummary>(() => {
  if (!selectedProcessId.value) {
    return createEmptyProcessMetricsSummary();
  }

  const metricsFromDetail = processDetail.value?.summary;
  if (metricsFromDetail) {
    return metricsFromDetail;
  }

  return (
    processMetricsMap.value[selectedProcessId.value] ??
    createEmptyProcessMetricsSummary()
  );
});

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
  () => activeProcessSteps.value.slice(),
  steps => {
    const previousMap = processMetricsMap.value;
    const nextMap = buildEmptyMetricsMap(steps);
    for (const step of steps) {
      if (previousMap[step]) {
        nextMap[step] = previousMap[step];
      }
    }
    processMetricsMap.value = { ...nextMap };

    if (selectedProcessId.value && !steps.includes(selectedProcessId.value)) {
      selectedProcessId.value = null;
      processDetail.value = null;
      detailError.value = null;
    }
  },
  { immediate: true }
);

watch(
  () => filters.product,
  value => {
    if (!value) {
      filters.processCode = null;
      syncProcessStepsWithSelection();
      processMetricsMap.value = {
        ...buildEmptyMetricsMap(activeProcessSteps.value)
      };
    }
  }
);

watch(
  () => filters.processCode,
  () => {
    syncProcessStepsWithSelection();
  },
  { immediate: true }
);

watch(
  processOptions,
  options => {
    if (
      filters.processCode &&
      !options.some(option => String(option.value) === filters.processCode)
    ) {
      filters.processCode = null;
      syncProcessStepsWithSelection();
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
  processMetricsMap.value = { ...baseMap };

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

  processMetricsMap.value = { ...baseMap };

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
    let productOptionPayload: SelectOption[] = [];
    if (shouldFetchProducts) {
      try {
        const result = await fetchDashboardProducts({
          startDate: params.startDate,
          endDate: params.endDate,
          origin: selectedOrigin
        });
        productOptionPayload = result.map(item => ({
          label: item.label,
          value: item.code
        }));
      } catch (error: any) {
        const message = error?.message ?? "获取产品选项失败";
        ElMessage.warning(message);
      }
    }

    productOptions.value = productOptionPayload;
    const availableProductCodes = new Set(
      productOptionPayload.map(item => item.value)
    );
    if (filters.product && !availableProductCodes.has(filters.product)) {
      filters.product = null;
    }

    originOptions.value = PRODUCT_ORIGIN_OPTIONS.map(option => ({ ...option }));
    workOrders.value = [];

    let metricsAvailable = false;
    if (params.product) {
      metricsAvailable = await refreshProcessMetrics(params);
    } else {
      processMetricsMap.value = {
        ...buildEmptyMetricsMap(activeProcessSteps.value)
      };
    }

    if (!metricsAvailable && !workOrders.value.length && params.product) {
      summaryError.value = "当前筛选条件没有匹配的数据";
    }
  } catch (error: any) {
    const message = error?.message ?? "获取仪表盘数据失败";
    summaryError.value = message;
    processMetricsMap.value = {
      ...buildEmptyMetricsMap(activeProcessSteps.value)
    };
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
  filters.processCode = null;
  syncProcessStepsWithSelection();
  processMetricsMap.value = {
    ...buildEmptyMetricsMap(activeProcessSteps.value)
  };
  handleFiltersSubmit();
};

onMounted(async () => {
  await Promise.all([
    processStore.setProcessFlow(),
    processStore.setProcessSteps()
  ]);
  syncProcessStepsWithSelection();
  fetchSummary();
});
</script>

<style scoped>
.dashboard-page {
  padding-bottom: 24px;
}
</style>
