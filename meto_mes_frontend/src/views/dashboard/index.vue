<template>
  <div class="dashboard-page space-y-4">
    <el-card shadow="never">
      <filters-panel
        :date-range="filters.dateRange"
        :product="filters.product"
        :origins="filters.origins"
        :product-options="productOptions"
        :origin-options="originOptions"
        :loading="filtersLoading"
        @update:dateRange="value => (filters.dateRange = value)"
        @update:product="value => (filters.product = value)"
        @update:origins="value => (filters.origins = value)"
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
          <el-button v-if="isDetailVisible" link type="primary" @click="handleBackToOverview">
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
  ProcessMetric,
  SelectOption,
  WorkOrderRow
} from "./types";
import {
  fetchDashboardSummary,
  fetchProcessDetail,
  fetchDashboardProducts
} from "@/api/dashboard";
import type { DashboardSummaryParams } from "@/api/dashboard";
import { PRODUCT_ORIGIN_OPTIONS } from "@/enums/product-origin";

const getDefaultDateRange = (): string[] => {
  const today = dayjs().format("YYYY-MM-DD");
  return [today, today];
};

const filters = reactive<FilterState>({
  dateRange: getDefaultDateRange(),
  product: null,
  origins: []
});

const productOptions = ref<SelectOption[]>([]);
const originOptions = ref<SelectOption[]>(
  PRODUCT_ORIGIN_OPTIONS.map(option => ({ ...option }))
);
const processes = ref<ProcessMetric[]>([]);
const workOrders = ref<WorkOrderRow[]>([]);

const overviewLoading = ref(false);
const detailLoading = ref(false);
const summaryError = ref<string | null>(null);
const detailError = ref<string | null>(null);

const selectedProcessId = ref<string | null>(null);
const processDetail = ref<ProcessDetailData | null>(null);

const isDetailVisible = computed(() => selectedProcessId.value !== null);
const filtersLoading = computed(() => overviewLoading.value || detailLoading.value);

const selectedProcessName = computed(() => {
  if (!selectedProcessId.value) return "";
  if (processDetail.value?.processName) return processDetail.value.processName;
  return processes.value.find(item => item.id === selectedProcessId.value)?.name ?? selectedProcessId.value;
});

const headerTitle = computed(() =>
  isDetailVisible.value ? `${selectedProcessName.value} 工序详情` : "工序概览"
);

watch(
  () => filters.origins.slice(),
  () => {
    productOptions.value = [];
    if (filters.product) {
      filters.product = null;
    }
  }
);

const buildSummaryParams = (): DashboardSummaryParams => {
  const hasRange = filters.dateRange.length === 2;
  return {
    startDate: hasRange ? filters.dateRange[0] : undefined,
    endDate: hasRange ? filters.dateRange[1] : undefined,
    product: filters.product,
    origins: filters.origins
  };
};

const fetchSummary = async () => {
  overviewLoading.value = true;
  summaryError.value = null;
  try {
    const params = buildSummaryParams();
    const selectedOrigin = filters.origins.length === 1 ? filters.origins[0] : undefined;

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
    const productOptionPayload = shouldFetchProducts ? await productOptionsPromise : [];

    const nextProductOptions = shouldFetchProducts
      ? productOptionPayload.length
        ? productOptionPayload.map(item => ({ label: item.label, value: item.code }))
        : result.filters.products
      : [];

    productOptions.value = nextProductOptions;
    const availableProductCodes = new Set(nextProductOptions.map(item => item.value));
    if (filters.product && !availableProductCodes.has(filters.product)) {
      filters.product = null;
    }

    originOptions.value = result.filters.origins.length
      ? result.filters.origins
      : PRODUCT_ORIGIN_OPTIONS.map(option => ({ ...option }));
    processes.value = result.processes;
    workOrders.value = result.workOrders;
    if (!result.processes.length && !result.workOrders.length) {
      summaryError.value = "当前筛选条件没有匹配的数据";
    }
  } catch (error: any) {
    const message = error?.message ?? "获取仪表盘数据失败";
    summaryError.value = message;
    processes.value = [];
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
    const result = await fetchProcessDetail({ ...params, processId });
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
  filters.origins = [];
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
