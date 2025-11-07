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
        :metrics="selectedProcessMetrics"
        :pareto="paretoData"
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
import { getFlowCodeByMaterial } from "@/api/quality";
import type {
  FilterState,
  ParetoChartData,
  ProcessMetricsSummary,
  ProcessOverviewItem,
  SelectOption,
  WorkOrderRow
} from "./types";
import {
  fetchParetoData,
  fetchDashboardProducts,
  fetchProcessMetrics,
  fetchProcessStageInfo
} from "@/api/dashboard";
import type { DashboardSummaryParams, ProcessStageInfo } from "@/api/dashboard";
import { PRODUCT_ORIGIN_OPTIONS, ProductOrigin } from "@/enums/product-origin";
import { STEP_NO } from "@/enums/step-no";
import { useProcessStore } from "@/store/modules/processFlow";
import type { ProcessFlow } from "@/api/processFlow";

const getDefaultDateRange = (): string[] => {
  const start = dayjs().startOf("day").format("YYYY-MM-DD HH:mm:ss");
  const end = dayjs().endOf("day").format("YYYY-MM-DD HH:mm:ss");
  return [start, end];
};

const DEFAULT_STEP_TYPE_NOS: string[] = [];

interface ProcessStepInfo {
  id: string;
  code: string | null;
  label?: string;
}

const buildDefaultActiveSteps = (): ProcessStepInfo[] =>
  DEFAULT_STEP_TYPE_NOS.map(step => ({ id: step, code: step }));

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
const processStagesInfo = ref<ProcessStageInfo[]>([]);
let processStageRequestToken = 0;
const processMetricsMap = ref<Record<string, ProcessMetricsSummary>>({});
const workOrders = ref<WorkOrderRow[]>([]);

const overviewLoading = ref(false);
const detailLoading = ref(false);
const summaryError = ref<string | null>(null);
const detailError = ref<string | null>(null);

const selectedProcessId = ref<string | null>(null);
const createEmptyParetoData = (): ParetoChartData => ({
  categories: [],
  counts: [],
  cumulative: []
});
const paretoData = ref<ParetoChartData>(createEmptyParetoData());

let productProcessRequestToken = 0;

function normalizeStringValue(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (value === null || value === undefined) {
    return null;
  }

  const stringified = String(value).trim();
  return stringified.length > 0 ? stringified : null;
}

function extractFlowCodes(response: any): string[] {
  const source = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response)
      ? response
      : [];

  const codes = source
    .map((item: any) =>
      normalizeStringValue(
        item?.flow_code ??
          item?.flowCode ??
          item?.process_code ??
          item?.processCode
      )
    )
    .filter((code): code is string => Boolean(code));

  return Array.from(new Set(codes));
}

function selectPreferredProcessCode(codes: string[]): string | null {
  if (!codes.length) {
    return null;
  }

  const availableCodes = new Set(
    (processOptions.value ?? [])
      .map(option => normalizeStringValue(option?.value))
      .filter((code): code is string => Boolean(code))
  );

  if (availableCodes.size > 0) {
    for (const code of codes) {
      if (availableCodes.has(code)) {
        return code;
      }
    }
    return null;
  }

  return codes[0] ?? null;
}

const resetProcessDataState = () => {
  syncProcessStepsWithSelection();
  processMetricsMap.value = {
    ...buildEmptyMetricsMap(activeProcessSteps.value)
  };
  selectedProcessId.value = null;
  detailError.value = null;
  paretoData.value = createEmptyParetoData();
};

const getStepDisplayLabel = (step: ProcessStepInfo): string => {
  const explicitLabel = step.label?.trim?.();
  if (explicitLabel) {
    return explicitLabel;
  }

  const normalizedCode = step.code?.trim?.();
  if (normalizedCode) {
    return normalizedCode;
  }

  return step.id;
};

const buildEmptyMetricsMap = (
  steps: ProcessStepInfo[]
): Record<string, ProcessMetricsSummary> => {
  return steps.reduce<Record<string, ProcessMetricsSummary>>((acc, step) => {
    acc[step.id] = createEmptyProcessMetricsSummary();
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

const deriveStepsFromProcessCode = (code: string | null): ProcessStepInfo[] => {
  if (!code) {
    return [];
  }

  const stages = Array.isArray(processStagesInfo.value)
    ? processStagesInfo.value
    : [];

  if (!stages.length) {
    return [];
  }

  const usedIds = new Set<string>();

  return stages.map((stage, index) => {
    const rawStageCode = stage?.stageCode?.trim?.();
    const normalizedStageCode =
      rawStageCode && rawStageCode.length > 0 ? rawStageCode : null;
    const rawStepCode = stage?.sysStepTypeNo?.trim?.();
    const normalizedStepCode =
      rawStepCode && rawStepCode.length > 0 ? rawStepCode : null;
    const rawLabel = stage?.stageName?.trim?.();
    const fallbackLabel =
      rawLabel && rawLabel.length > 0
        ? rawLabel
        : (normalizedStepCode ?? normalizedStageCode ?? `${code}-${index + 1}`);

    const baseId =
      normalizedStageCode ?? normalizedStepCode ?? `${code}-${index + 1}`;
    let stepId = baseId || `${code}-${index + 1}`;

    let uniqueId = stepId;
    let suffix = 1;
    while (usedIds.has(uniqueId)) {
      uniqueId = `${stepId}-${suffix++}`;
    }

    usedIds.add(uniqueId);

    return {
      id: uniqueId,
      code: normalizedStepCode,
      label: fallbackLabel
    };
  });
};

const activeProcessSteps = ref<ProcessStepInfo[]>(buildDefaultActiveSteps());

const setActiveProcessSteps = (
  steps: ProcessStepInfo[],
  options: { fallbackToDefault?: boolean } = {}
) => {
  if (steps.length) {
    activeProcessSteps.value = steps;
    return;
  }

  if (options.fallbackToDefault !== false) {
    activeProcessSteps.value = buildDefaultActiveSteps();
  } else {
    activeProcessSteps.value = [];
  }
};

const syncProcessStepsWithSelection = () => {
  const requestToken = ++processStageRequestToken;
  const processCode = filters.processCode?.trim?.() ?? null;

  if (!processCode) {
    processStagesInfo.value = [];
    setActiveProcessSteps([], { fallbackToDefault: true });
    return;
  }

  fetchProcessStageInfo({
    processCode,
    origin: filters.origin ?? undefined
  })
    .then(result => {
      if (requestToken !== processStageRequestToken) {
        return;
      }
      console.log(result);
      const stages = Array.isArray(result) ? result : [];
      processStagesInfo.value = stages;
      const derived = deriveStepsFromProcessCode(processCode);
      setActiveProcessSteps(derived, {
        fallbackToDefault: stages.length === 0
      });
    })
    .catch((error: any) => {
      if (requestToken !== processStageRequestToken) {
        return;
      }

      processStagesInfo.value = [];
      setActiveProcessSteps([], { fallbackToDefault: true });

      const message = error?.message ?? "获取工序信息失败";
      ElMessage.warning(message);
    });
};

processMetricsMap.value = {
  ...buildEmptyMetricsMap(activeProcessSteps.value)
};

const processes = computed<ProcessOverviewItem[]>(() =>
  activeProcessSteps.value.map(step => ({
    id: step.id,
    name: getStepDisplayLabel(step),
    code: step.code,
    metrics:
      processMetricsMap.value[step.id] ?? createEmptyProcessMetricsSummary()
  }))
);

const isDetailVisible = computed(() => selectedProcessId.value !== null);
const filtersLoading = computed(
  () => overviewLoading.value || detailLoading.value
);

const activeProcessStepMap = computed(() => {
  const map = new Map<string, ProcessStepInfo>();
  activeProcessSteps.value.forEach(step => {
    map.set(step.id, step);
  });
  return map;
});

const selectedProcessName = computed(() => {
  if (!selectedProcessId.value) return "";
  const step = activeProcessStepMap.value.get(selectedProcessId.value);
  if (step) {
    return getStepDisplayLabel(step);
  }
  return selectedProcessId.value;
});

const headerTitle = computed(() =>
  isDetailVisible.value ? `${selectedProcessName.value} 工序详情` : "工序概览"
);

const selectedProcessMetrics = computed<ProcessMetricsSummary>(() => {
  if (!selectedProcessId.value) {
    return createEmptyProcessMetricsSummary();
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
  async value => {
    resetProductSelection();
    try {
      await processStore.setProcessFlow(true, value ?? null);
    } catch (error: any) {
      const message = error?.message ?? "获取工艺流程失败";
      ElMessage.error(message);
    }
    refreshProductOptions();
    syncProcessStepsWithSelection();
  }
);

watch(
  () => filters.dateRange.slice(),
  () => {
    refreshProductOptions();
  }
);

watch(
  activeProcessSteps,
  steps => {
    const previousMap = processMetricsMap.value;
    const nextMap = buildEmptyMetricsMap(steps);
    for (const step of steps) {
      if (previousMap[step.id]) {
        nextMap[step.id] = previousMap[step.id];
      }
    }
    processMetricsMap.value = { ...nextMap };

    if (
      selectedProcessId.value &&
      !steps.some(step => step.id === selectedProcessId.value)
    ) {
      selectedProcessId.value = null;
      detailError.value = null;
      paretoData.value = createEmptyParetoData();
    }
  },
  { immediate: true, deep: true }
);

watch(
  () => filters.product,
  async value => {
    const normalizedProduct = normalizeStringValue(value);
    const requestToken = ++productProcessRequestToken;

    filters.processCode = null;
    resetProcessDataState();

    if (!normalizedProduct) {
      return;
    }

    try {
      const response = await getFlowCodeByMaterial(normalizedProduct);
      if (requestToken !== productProcessRequestToken) {
        return;
      }

      const candidateCodes = extractFlowCodes(response);
      const preferredCode = selectPreferredProcessCode(candidateCodes);
      if (preferredCode) {
        filters.processCode = preferredCode;
      }
    } catch (error) {
      if (requestToken !== productProcessRequestToken) {
        return;
      }
      console.error(error);
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

watch(processOptions, options => {
  if (
    filters.processCode &&
    !options.some(option => String(option.value) === filters.processCode)
  ) {
    filters.processCode = null;
    syncProcessStepsWithSelection();
  }
});

const buildSummaryParams = (): DashboardSummaryParams => {
  const hasRange =
    filters.dateRange.length === 2 &&
    filters.dateRange[0] &&
    filters.dateRange[1];
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
  console.log(1, params.product)
  const steps = activeProcessSteps.value;
  const baseMap = buildEmptyMetricsMap(steps);
  processMetricsMap.value = { ...baseMap };

  if (!params.product || !steps.length) {
    return false;
  }

  const requestableSteps = steps.filter(step => step.code);

  if (!requestableSteps.length) {
    return false;
  }

  const requests = requestableSteps.map(step =>
    fetchProcessMetrics({
      startDate: params.startDate,
      endDate: params.endDate,
      origin: params.origin,
      product: params.product!,
      stepTypeNo: step.code!
    }).then(summary => ({ id: step.id, summary }))
  );
  
  const results = await Promise.allSettled(requests);
  console.log(results)
  let hasData = false;
  const failedSteps: string[] = [];
  let firstErrorMessage: string | null = null;

  results.forEach((result, index) => {
    const step = requestableSteps[index];
    if (result.status === "fulfilled") {
      const summary = result.value.summary;
      baseMap[result.value.id] = summary;
      if (hasMeaningfulMetrics(summary)) {
        hasData = true;
      }
    } else {
      baseMap[step.id] = createEmptyProcessMetricsSummary();
      failedSteps.push(getStepDisplayLabel(step));
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
    const currentProduct = filters.product;
    const preservedProductOption = currentProduct
      ? productOptions.value.find(option => option.value === currentProduct) ?? null
      : null;
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
        if (currentProduct) {
          const hasSelectedProduct = productOptionPayload.some(
            option => option.value === currentProduct
          );
          if (!hasSelectedProduct) {
            if (preservedProductOption) {
              productOptionPayload.push({ ...preservedProductOption });
            } else {
              productOptionPayload.push({
                label: String(currentProduct),
                value: currentProduct
              });
            }
          }
        }
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
    selectedProcessId.value = null;
    paretoData.value = createEmptyParetoData();
    detailError.value = null;
    ElMessage.error(message);
  } finally {
    overviewLoading.value = false;
  }
};

const handleProcessSelect = async (processId: string) => {
  if (detailLoading.value) return;
  const step = activeProcessStepMap.value.get(processId);
  selectedProcessId.value = processId;
  detailError.value = null;
  paretoData.value = createEmptyParetoData();

  if (!step?.code) {
    detailError.value = "当前工序缺少编号，无法获取柏拉图数据";
    return;
  }

  const params = buildSummaryParams();
  if (!params.product) {
    detailError.value = "请选择产品后查看工序详情";
    return;
  }

  if (params.origin === undefined) {
    detailError.value = "请选择产地后查看工序详情";
    return;
  }

  detailLoading.value = true;
  try {
    const product = params.product;
    const origin = params.origin;
    const result = await fetchParetoData({
      product,
      origin,
      stepTypeNo: step.code,
      startDate: params.startDate,
      endDate: params.endDate
    });
    paretoData.value = result;
  } catch (error: any) {
    const message = error?.message ?? "获取柏拉图数据失败";
    detailError.value = message;
    ElMessage.error(message);
  } finally {
    detailLoading.value = false;
  }
};

const handleBackToOverview = () => {
  selectedProcessId.value = null;
  detailError.value = null;
  paretoData.value = createEmptyParetoData();
};

const handleFiltersSubmit = () => {
  selectedProcessId.value = null;
  detailError.value = null;
  paretoData.value = createEmptyParetoData();
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
  paretoData.value = createEmptyParetoData();
  handleFiltersSubmit();
};

onMounted(async () => {
  try {
    await processStore.setProcessFlow(false, filters.origin ?? null);
  } catch (error: any) {
    const message = error?.message ?? "获取工艺流程失败";
    ElMessage.error(message);
  }
  syncProcessStepsWithSelection();
  fetchSummary();
});
</script>

<style scoped>
.dashboard-page {
  padding-bottom: 24px;
}
</style>
