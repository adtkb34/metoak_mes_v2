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
        :show-product="showProductFilter"
        :show-process="showProcessFilter"
        :product-multiple="allowMultipleProducts"
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
          <div class="flex items-center gap-2">
            <el-button
              v-if="canNavigateBack"
              link
              type="primary"
              @click="handleNavigateBack"
            >
              {{ backButtonLabel }}
            </el-button>
            <el-button
              v-if="level === 'process' && isDetailVisible"
              link
              type="primary"
              @click="handleBackToOverview"
            >
              返回工序概览
            </el-button>
          </div>
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
        v-else-if="overviewErrorMessage"
        class="mb-4"
        type="error"
        :closable="false"
        show-icon
        :title="overviewErrorMessage"
      />

      <template v-if="level === 'process'">
        <process-detail
          v-if="isDetailVisible"
          :metrics="selectedProcessMetrics"
          :pareto="paretoData"
          :loading="detailLoading"
        />
        <process-overview
          v-else
          :processes="displayedOverviewItems"
          :loading="overviewLoading"
          @select="handleOverviewSelect"
        />
      </template>
      <template v-else>
        <process-overview
          :processes="displayedOverviewItems"
          :loading="overviewLoading"
          @select="handleOverviewSelect"
        />
      </template>
    </el-card>

    <el-card v-if="level === 'process'" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-base font-medium text-gray-700">在制工单</span>
          <el-tag type="info" effect="plain">
            共 {{ workOrders.length }} 条
          </el-tag>
        </div>
      </template>
      <work-orders-table
        :work-orders="workOrders"
        :loading="workOrdersLoading"
      />
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
  fetchStepTypeProcessMetrics,
  fetchProcessStageInfo,
  fetchWorkOrderCodes,
  fetchWorkOrderProcessMetrics
} from "@/api/dashboard";
import type { DashboardSummaryParams, ProcessStageInfo } from "@/api/dashboard";
import { PRODUCT_ORIGIN_OPTIONS, ProductOrigin } from "@/enums/product-origin";
import { STEP_NO } from "@/enums/step-no";
import { useProcessStore } from "@/store/modules/processFlow";
import type { ProcessFlow } from "@/api/processFlow";

type ViewLevel = "step" | "product" | "process";

const STEP_OVERVIEW_CODES: string[] = [
  STEP_NO.AUTO_ADJUST,
  STEP_NO.CALIB,
  STEP_NO.FQC
];

const STEP_TITLE_MAP: Record<string, string> = {
  [STEP_NO.AUTO_ADJUST]: "AA",
  [STEP_NO.FQC]: "FQC",
  [STEP_NO.CALIB]: "标定"
};

const getDefaultDateRange = (): string[] => {
  const today = dayjs().format("YYYY-MM-DD");
  return [today, today];
};

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "";
const getDefaultOrigin = (): ProductOrigin =>
  backendUrl.includes("11.11.11.15")
    ? ProductOrigin.Suzhou
    : ProductOrigin.Mianyang;

const filters = reactive<FilterState>({
  dateRange: getDefaultDateRange(),
  product: [] as string[],
  origin: getDefaultOrigin(),
  processCode: null
});

const level = ref<ViewLevel>("step");
const selectedStepTypeNo = ref<string | null>(null);
const selectedProductCode = ref<string | null>(null);
const selectedWorkOrderCode = ref<string | null>(null);

const processStore = useProcessStore();

const productOptions = ref<SelectOption[]>([]);
const productOptionMap = computed(() => {
  const map = new Map<string, string>();
  productOptions.value.forEach(option => {
    map.set(String(option.value), option.label);
  });
  return map;
});

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

interface ProcessStepInfo {
  id: string;
  code: string | null;
  label?: string;
}

const DEFAULT_STEP_TYPE_NOS: string[] = [];

const buildDefaultActiveSteps = (): ProcessStepInfo[] =>
  DEFAULT_STEP_TYPE_NOS.map(step => ({ id: step, code: step }));

const createEmptyProcessMetricsSummary = (): ProcessMetricsSummary => ({
  数量: { 良品: "-", 产品: "-", 总体: "-" },
  良率: { 一次: "-", 最终: "-", 总体: "-" },
  良品用时: { mean: "-", min: "-", max: "-" }
});

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

const processStagesInfo = ref<ProcessStageInfo[]>([]);
let processStageRequestToken = 0;
let workOrderRequestToken = 0;

const activeProcessSteps = ref<ProcessStepInfo[]>(buildDefaultActiveSteps());
const processMetricsMap = ref<Record<string, ProcessMetricsSummary>>({
  ...buildEmptyMetricsMap(activeProcessSteps.value)
});

const workOrders = ref<WorkOrderRow[]>([]);
const workOrdersLoading = ref(false);

const stepOverviewItems = ref<ProcessOverviewItem[]>([]);
const productOverviewItems = ref<ProcessOverviewItem[]>([]);

const overviewLoading = ref(false);
const detailLoading = ref(false);
const topLevelError = ref<string | null>(null);
const summaryError = ref<string | null>(null);
const detailError = ref<string | null>(null);

const selectedProcessId = ref<string | null>(null);

const createEmptyParetoData = (): ParetoChartData => ({
  categories: [],
  counts: [],
  cumulative: []
});
const paretoData = ref<ParetoChartData>(createEmptyParetoData());

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

const processes = computed<ProcessOverviewItem[]>(() =>
  activeProcessSteps.value.map(step => ({
    id: step.id,
    name: getStepDisplayLabel(step),
    code: step.code,
    metrics:
      processMetricsMap.value[step.id] ?? createEmptyProcessMetricsSummary()
  }))
);

const activeProcessStepMap = computed(() => {
  const map = new Map<string, ProcessStepInfo>();
  activeProcessSteps.value.forEach(step => {
    map.set(step.id, step);
  });
  return map;
});

const displayedOverviewItems = computed<ProcessOverviewItem[]>(() => {
  if (level.value === "process") {
    return processes.value;
  }
  if (level.value === "product") {
    return productOverviewItems.value;
  }
  return stepOverviewItems.value;
});

const selectedProcessName = computed(() => {
  if (!selectedProcessId.value) return "";
  const step = activeProcessStepMap.value.get(selectedProcessId.value);
  if (step) {
    return getStepDisplayLabel(step);
  }
  return selectedProcessId.value;
});

const selectedProcessMetrics = computed<ProcessMetricsSummary>(() => {
  if (!selectedProcessId.value) {
    return createEmptyProcessMetricsSummary();
  }

  return (
    processMetricsMap.value[selectedProcessId.value] ??
    createEmptyProcessMetricsSummary()
  );
});

const selectedStepTitle = computed(() => {
  if (!selectedStepTypeNo.value) {
    return "";
  }
  return STEP_TITLE_MAP[selectedStepTypeNo.value] ?? selectedStepTypeNo.value;
});

const selectedProductName = computed(() => {
  if (!selectedProductCode.value) {
    return "";
  }
  return (
    productOptionMap.value.get(selectedProductCode.value) ??
    selectedProductCode.value
  );
});

const isDetailVisible = computed(
  () => level.value === "process" && selectedProcessId.value !== null
);

const headerTitle = computed(() => {
  if (level.value === "step") {
    return "关键工序概览";
  }
  if (level.value === "product") {
    return selectedStepTitle.value
      ? `${selectedStepTitle.value} 产品统计`
      : "工序产品统计";
  }
  if (isDetailVisible.value) {
    return `${selectedProcessName.value} 工序详情`;
  }
  return selectedProductName.value
    ? `${selectedProductName.value} 工序概览`
    : "工序概览";
});

const filtersLoading = computed(
  () => overviewLoading.value || detailLoading.value
);

const showProductFilter = computed(() => level.value === "process");
const showProcessFilter = computed(() => level.value === "process");
const allowMultipleProducts = computed(() => level.value !== "process");

const canNavigateBack = computed(() => level.value !== "step");
const backButtonLabel = computed(() =>
  level.value === "process" ? "返回产品统计" : "返回关键工序"
);

const overviewErrorMessage = computed(() =>
  level.value === "process" ? summaryError.value : topLevelError.value
);

const normalizeStringValue = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (value === null || value === undefined) {
    return null;
  }

  const stringified = String(value).trim();
  return stringified.length > 0 ? stringified : null;
};

const extractFlowCodes = (response: any): string[] => {
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
};

const selectPreferredProcessCode = (codes: string[]): string | null => {
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
};

const getRequestRange = () => {
  if (filters.dateRange.length !== 2) {
    return {
      startDate: undefined as string | undefined,
      endDate: undefined as string | undefined
    };
  }
  const [start, end] = filters.dateRange;
  const startDate = start ? `${start} 00:00:00` : undefined;
  const endDate = end ? `${end} 23:59:59` : undefined;
  return { startDate, endDate };
};

const getProductLabel = (code: string): string => {
  return productOptionMap.value.get(code) ?? code;
};

const resetProcessDataState = () => {
  processMetricsMap.value = {
    ...buildEmptyMetricsMap(activeProcessSteps.value)
  };
  selectedProcessId.value = null;
  detailError.value = null;
  paretoData.value = createEmptyParetoData();
};

const clearWorkOrders = () => {
  workOrderRequestToken++;
  workOrders.value = [];
  workOrdersLoading.value = false;
};

const loadWorkOrderMetricsForStep = async (
  stepTypeNo: string | null
): Promise<void> => {
  clearWorkOrders();

  if (!stepTypeNo) {
    return;
  }

  const origin = filters.origin;
  const { startDate, endDate } = getRequestRange();

  if (origin === null || origin === undefined || !startDate || !endDate) {
    return;
  }

  const requestToken = ++workOrderRequestToken;
  workOrdersLoading.value = true;

  try {
    const codeMap = await fetchWorkOrderCodes({
      origin,
      stepTypeNo,
      startDate,
      endDate
    });

    if (requestToken !== workOrderRequestToken) {
      return;
    }

    const entries = Object.entries(codeMap ?? {}).filter(([code]) =>
      Boolean(normalizeStringValue(code))
    );

    if (!entries.length) {
      workOrders.value = [];
      return;
    }

    const requests = entries.map(([workOrderCode, rawProducts]) => {
      const normalizedProducts = (rawProducts ?? [])
        .map(code => normalizeStringValue(code))
        .filter((code): code is string => Boolean(code));

      return fetchWorkOrderProcessMetrics({
        origin,
        stepTypeNo,
        workOrderCode,
        startDate,
        endDate
      }).then(summary => ({
        workOrderCode,
        productCodes: normalizedProducts,
        products: normalizedProducts.map(getProductLabel),
        metrics: summary,
        origin
      }));
    });

    const results = await Promise.allSettled(requests);

    if (requestToken !== workOrderRequestToken) {
      return;
    }

    const rows: WorkOrderRow[] = [];
    const failedOrders: string[] = [];

    results.forEach((result, index) => {
      const [orderCode] = entries[index];
      if (result.status === "fulfilled") {
        rows.push(result.value);
      } else {
        failedOrders.push(orderCode);
      }
    });

    workOrders.value = rows;

    if (failedOrders.length) {
      ElMessage.error(`获取 ${failedOrders.join("、")} 工单指标失败`);
    }
  } catch (error: any) {
    if (requestToken !== workOrderRequestToken) {
      return;
    }
    const message = error?.message ?? "获取工单指标失败";
    workOrders.value = [];
    ElMessage.error(message);
  } finally {
    if (requestToken === workOrderRequestToken) {
      workOrdersLoading.value = false;
    }
  }
};

const syncProcessStepsWithSelection = async () => {
  const requestToken = ++processStageRequestToken;
  const processCode = filters.processCode?.trim?.() ?? null;

  if (!processCode) {
    processStagesInfo.value = [];
    setActiveProcessSteps([], { fallbackToDefault: true });
    return;
  }

  try {
    const result = await fetchProcessStageInfo({
      processCode,
      origin: filters.origin ?? undefined
    });

    if (requestToken !== processStageRequestToken) {
      return;
    }

    const stages = Array.isArray(result) ? result : [];
    processStagesInfo.value = stages;
    const derived = deriveStepsFromProcessCode(processCode);
    setActiveProcessSteps(derived, {
      fallbackToDefault: stages.length === 0
    });
  } catch (error: any) {
    if (requestToken !== processStageRequestToken) {
      return;
    }

    processStagesInfo.value = [];
    setActiveProcessSteps([], { fallbackToDefault: true });

    const message = error?.message ?? "获取工序信息失败";
    ElMessage.warning(message);
  }
};

const ensureProcessCodeForProduct = async (
  productCode: string
): Promise<string | null> => {
  try {
    const response = await getFlowCodeByMaterial(productCode);
    const candidateCodes = extractFlowCodes(response);
    const preferredCode = selectPreferredProcessCode(candidateCodes);
    return preferredCode;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const loadStepOverview = async () => {
  level.value = "step";
  selectedStepTypeNo.value = null;
  selectedProductCode.value = null;
  selectedWorkOrderCode.value = null;
  clearWorkOrders();
  topLevelError.value = null;
  overviewLoading.value = true;
  stepOverviewItems.value = [];

  const origin = filters.origin;
  const { startDate, endDate } = getRequestRange();

  if (origin === null || origin === undefined) {
    topLevelError.value = "请选择产地";
    overviewLoading.value = false;
    return;
  }

  if (!startDate || !endDate) {
    topLevelError.value = "请选择时间范围";
    overviewLoading.value = false;
    return;
  }

  const items: ProcessOverviewItem[] = [];
  const failedSteps: string[] = [];

  try {
    for (const stepTypeNo of STEP_OVERVIEW_CODES) {
      try {
        const summary = await fetchStepTypeProcessMetrics({
          origin,
          stepTypeNo,
          startDate,
          endDate
        });

        items.push({
          id: stepTypeNo,
          name: STEP_TITLE_MAP[stepTypeNo] ?? stepTypeNo,
          code: stepTypeNo,
          metrics: summary
        });
      } catch (error) {
        items.push({
          id: stepTypeNo,
          name: STEP_TITLE_MAP[stepTypeNo] ?? stepTypeNo,
          code: stepTypeNo,
          metrics: createEmptyProcessMetricsSummary()
        });
        failedSteps.push(STEP_TITLE_MAP[stepTypeNo] ?? stepTypeNo);
      }
    }

    stepOverviewItems.value = items;

    if (!items.some(item => hasMeaningfulMetrics(item.metrics))) {
      topLevelError.value = "当前筛选条件没有匹配的数据";
    } else if (failedSteps.length) {
      ElMessage.error(`获取 ${failedSteps.join("、")} 指标失败`);
    }
  } catch (error: any) {
    const message = error?.message ?? "获取工序统计失败";
    topLevelError.value = message;
    ElMessage.error(message);
  } finally {
    overviewLoading.value = false;
  }
};

const loadProductOverview = async (stepTypeNo: string) => {
  level.value = "product";
  selectedStepTypeNo.value = stepTypeNo;
  selectedProductCode.value = null;
  selectedWorkOrderCode.value = null;
  summaryError.value = null;
  topLevelError.value = null;
  overviewLoading.value = true;
  productOverviewItems.value = [];
  void loadWorkOrderMetricsForStep(stepTypeNo);

  const origin = filters.origin;
  const { startDate, endDate } = getRequestRange();

  if (origin === null || origin === undefined) {
    topLevelError.value = "请选择产地";
    overviewLoading.value = false;
    return;
  }

  if (!startDate || !endDate) {
    topLevelError.value = "请选择时间范围";
    overviewLoading.value = false;
    return;
  }

  try {
    const codeMap = await fetchWorkOrderCodes({
      origin,
      stepTypeNo,
      startDate,
      endDate
    });

    const entries = Object.entries(codeMap ?? {}).filter(([code]) =>
      Boolean(normalizeStringValue(code))
    );

    if (!entries.length) {
      topLevelError.value = "该工序暂无工单数据";
      return;
    }

    const requests = entries.map(([workOrderCode, rawProducts]) => {
      const normalizedProducts = (rawProducts ?? [])
        .map(code => normalizeStringValue(code))
        .filter((code): code is string => Boolean(code));
      const productCodeLabel = normalizedProducts.length
        ? normalizedProducts.join("、")
        : "-";

      return fetchWorkOrderProcessMetrics({
        origin,
        stepTypeNo,
        workOrderCode,
        startDate,
        endDate
      }).then(summary => ({
        id: workOrderCode,
        name: workOrderCode,
        code: null,
        titleLabel: "工单号",
        metaLabel: "产品料号",
        metaValue: productCodeLabel,
        targetProductCode: normalizedProducts[0] ?? null,
        targetWorkOrderCode: workOrderCode,
        metrics: summary
      }));
    });

    const results = await Promise.allSettled(requests);
    const items: ProcessOverviewItem[] = [];
    const failedOrders: string[] = [];

    results.forEach((result, index) => {
      const [workOrderCode] = entries[index];
      if (result.status === "fulfilled") {
        items.push(result.value);
      } else {
        failedOrders.push(workOrderCode);
      }
    });

    productOverviewItems.value = items;

    if (!items.length) {
      topLevelError.value = "该工序暂无工单统计数据";
    } else if (failedOrders.length) {
      ElMessage.error(`获取 ${failedOrders.join("、")} 工单指标失败`);
    }
  } catch (error: any) {
    const message = error?.message ?? "获取工单统计失败";
    topLevelError.value = message;
    ElMessage.error(message);
  } finally {
    overviewLoading.value = false;
  }
};

const loadProcessOverviewForProduct = async () => {
  level.value = "process";
  overviewLoading.value = true;
  summaryError.value = null;

  const params = buildSummaryParams();
  if (!params.product || !params.product.length) {
    summaryError.value = "请选择产品";
    overviewLoading.value = false;
    return;
  }

  try {
    await syncProcessStepsWithSelection();
    resetProcessDataState();

    if (!activeProcessSteps.value.length) {
      summaryError.value = "当前工艺暂无工序配置";
      return;
    }

    const hasData = await refreshProcessMetrics(params);

    if (!hasData) {
      summaryError.value = "当前筛选条件没有匹配的数据";
    }
  } catch (error: any) {
    const message = error?.message ?? "获取工序指标失败";
    summaryError.value = message;
    processMetricsMap.value = {
      ...buildEmptyMetricsMap(activeProcessSteps.value)
    };
    ElMessage.error(message);
  } finally {
    overviewLoading.value = false;
  }
};

const handleStepSelect = async (stepTypeNo: string) => {
  if (overviewLoading.value) {
    return;
  }
  await loadProductOverview(stepTypeNo);
};

const handleProductSelect = async (productCode: string) => {
  if (overviewLoading.value) {
    return;
  }

  selectedWorkOrderCode.value = null;
  selectedProductCode.value = productCode;
  filters.product = [productCode];

  const preferredProcess = await ensureProcessCodeForProduct(productCode);
  filters.processCode = preferredProcess ?? null;

  await loadProcessOverviewForProduct();
};

const handleWorkOrderSelect = async (
  workOrderCode: string,
  productCode: string | null
) => {
  if (overviewLoading.value) {
    return;
  }

  if (!productCode) {
    ElMessage.warning("当前工单缺少产品料号，无法查看工序详情");
    return;
  }

  selectedWorkOrderCode.value = workOrderCode;
  selectedProductCode.value = productCode;
  filters.product = [productCode];

  const preferredProcess = await ensureProcessCodeForProduct(productCode);
  filters.processCode = preferredProcess ?? null;

  await loadProcessOverviewForProduct();
};

const handleProcessSelect = async (processId: string) => {
  if (level.value !== "process" || detailLoading.value) return;
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

const handleOverviewSelect = async (id: string) => {
  if (level.value === "step") {
    await handleStepSelect(id);
    return;
  }

  if (level.value === "product") {
    const target = productOverviewItems.value.find(item => item.id === id);
    const workOrderCode = target?.targetWorkOrderCode ?? target?.id ?? null;
    const productCode = target?.targetProductCode ?? null;
    if (!workOrderCode) {
      ElMessage.warning("未找到工单信息，无法查看工序详情");
      return;
    }
    await handleWorkOrderSelect(workOrderCode, productCode);
    return;
  }

  await handleProcessSelect(id);
};

const handleBackToOverview = () => {
  selectedProcessId.value = null;
  detailError.value = null;
  paretoData.value = createEmptyParetoData();
};

const handleNavigateBack = async () => {
  if (level.value === "process") {
    level.value = "product";
    summaryError.value = null;
    selectedProcessId.value = null;
    detailError.value = null;
    paretoData.value = createEmptyParetoData();
    selectedWorkOrderCode.value = null;
    return;
  }

  if (level.value === "product") {
    level.value = "step";
    topLevelError.value = null;
    selectedStepTypeNo.value = null;
    selectedProductCode.value = null;
    selectedWorkOrderCode.value = null;
    clearWorkOrders();
    return;
  }
};

const buildSummaryParams = (): DashboardSummaryParams => {
  const { startDate, endDate } = getRequestRange();
  const normalizedProducts = filters.product
    .map(code => (typeof code === "string" ? code.trim() : String(code).trim()))
    .filter(code => code.length > 0);
  return {
    startDate,
    endDate,
    product: normalizedProducts.length ? normalizedProducts : undefined,
    origin: filters.origin ?? undefined
  };
};

const refreshProcessMetrics = async (
  params: DashboardSummaryParams
): Promise<boolean> => {
  const steps = activeProcessSteps.value;
  const baseMap = buildEmptyMetricsMap(steps);
  processMetricsMap.value = { ...baseMap };

  if (!steps.length) {
    return false;
  }

  const hasWorkOrderSelection = Boolean(selectedWorkOrderCode.value);
  if (!hasWorkOrderSelection && (!params.product || !params.product.length)) {
    return false;
  }

  const requestableSteps = steps.filter(step => step.code);

  if (!requestableSteps.length) {
    return false;
  }

  const requests = requestableSteps.map(step => {
    return fetchProcessMetrics({
      startDate: params.startDate,
      endDate: params.endDate,
      origin: params.origin,
      product: params.product!,
      stepTypeNo: step.code!,
      workOrderCode: selectedWorkOrderCode.value!,
    }).then(summary => ({ id: step.id, summary }));
  });

  const results = await Promise.allSettled(requests);
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

const handleFiltersSubmit = async () => {
  selectedProcessId.value = null;
  detailError.value = null;
  paretoData.value = createEmptyParetoData();
  if (level.value === "step") {
    await loadStepOverview();
    return;
  }


  if (level.value === "product") {
    if (!selectedStepTypeNo.value) {
      topLevelError.value = "请选择工序";
      return;
    }
    await loadProductOverview(selectedStepTypeNo.value);
    return;
  }

  if (!selectedStepTypeNo.value) {
    summaryError.value = "请选择工序";
    return;
  }

  const product = filters.product[0] ?? selectedProductCode.value;
  if (!product) {
    summaryError.value = "请选择产品";
    return;
  }

  // selectedWorkOrderCode.value = null;
  selectedProductCode.value = product;
  filters.product = [product];
  const selectedProcessCode = normalizeStringValue(filters.processCode);
  if (!selectedProcessCode) {
    const preferredProcess = await ensureProcessCodeForProduct(product);
    filters.processCode = preferredProcess ?? null;
  }

  await loadProcessOverviewForProduct();
  await loadWorkOrderMetricsForStep(selectedStepTypeNo.value);
};

const handleFiltersReset = async () => {
  filters.dateRange = getDefaultDateRange();
  filters.product = [];
  filters.origin = getDefaultOrigin();
  filters.processCode = null;
  topLevelError.value = null;
  summaryError.value = null;
  detailError.value = null;
  selectedProcessId.value = null;
  paretoData.value = createEmptyParetoData();
  selectedWorkOrderCode.value = null;
  clearWorkOrders();
  await loadStepOverview();
};

let productOptionsRequestToken = 0;

const resetProductSelection = () => {
  productOptionsRequestToken++;
  productOptions.value = [];
  if (filters.product.length) {
    filters.product = [];
  }
  selectedProductCode.value = null;
  selectedWorkOrderCode.value = null;
};

const refreshProductOptions = async () => {
  const { startDate, endDate } = getRequestRange();
  const selectedOrigin = filters.origin ?? undefined;

  if (!startDate || !endDate || selectedOrigin === undefined) {
    productOptions.value = [];
    return;
  }

  const requestToken = ++productOptionsRequestToken;

  try {
    const result = await fetchDashboardProducts({
      startDate,
      endDate,
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
      filters.product.length &&
      !filters.product.some(p =>
        nextProductOptions.some(opt => opt.value === p)
      )
    ) {
      filters.product = [];
    }
  } catch (error: any) {
    if (requestToken !== productOptionsRequestToken) {
      return;
    }

    const message = error?.message ?? "获取产品选项失败";
    ElMessage.warning(message);
    productOptions.value = [];
    if (filters.product.length) {
      filters.product = [];
    }
  }
};

watch(
  () => filters.origin,
  async value => {
    resetProductSelection();
    selectedStepTypeNo.value = null;
    selectedProductCode.value = null;
    level.value = "step";
    clearWorkOrders();
    try {
      await processStore.setProcessFlow(true, value ?? null);
    } catch (error: any) {
      const message = error?.message ?? "获取工艺流程失败";
      ElMessage.error(message);
    }
    await refreshProductOptions();
    await loadStepOverview();
  }
);

watch(
  () => filters.dateRange.slice(),
  () => {
    refreshProductOptions();
  }
);

watch(processOptions, options => {
  if (
    filters.processCode &&
    !options.some(option => String(option.value) === filters.processCode)
  ) {
    filters.processCode = null;
  }
});

onMounted(async () => {
  try {
    await processStore.setProcessFlow(false, filters.origin ?? null);
  } catch (error: any) {
    const message = error?.message ?? "获取工艺流程失败";
    ElMessage.error(message);
  }

  await refreshProductOptions();
  await loadStepOverview();
});
</script>

<style scoped>
.dashboard-page {
  padding-bottom: 24px;
}
</style>
