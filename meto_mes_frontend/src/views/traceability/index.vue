<script setup lang="ts">
import { computed, reactive, ref, onMounted, watch } from "vue";
import { Loading as LoadingIcon } from "@element-plus/icons-vue";
import {
  getTraceabilityBase,
  getTraceabilityMaterials,
  getTraceabilityProcess,
  getTraceabilityMaterialCode,
  type TraceabilityBaseOption,
  type TraceabilityFlowSummary,
  type TraceabilityMaterialInfo,
  type TraceabilityProcessRecord,
  type TraceabilityProcessStepSummary
} from "@/api/traceability";
import { getFlowCodeByMaterial } from "@/api/quality";
import { useProcessStore } from "@/store/modules/processFlow";
import { message } from "@/utils/message";
import { formatToUTC8 } from "@/utils/date";

defineOptions({ name: "Traceability" });

type StatusTagType = "" | "success" | "danger";

interface TraceabilityStatusTag {
  text: string;
  type: StatusTagType;
}

interface TraceabilityTreeRow extends TraceabilityProcessRecord {
  id: string;
  stageCode: string;
  processName: string | null;
  stageName: string | null;
  stepTypeNo: string;
  children?: TraceabilityTreeRow[] | null;
  __isLatest?: boolean;
  __statusTag?: TraceabilityStatusTag;
  __statusText?: string;
}

interface TraceabilityColumn {
  prop: string;
  label: string;
}

type TraceabilityProcessStepWithData = TraceabilityProcessStepSummary & {
  data: TraceabilityProcessRecord[];
};

const processStore = useProcessStore();

const query = reactive({
  serialNumber: "",
  processCode: ""
});

const loading = ref(false);
const baseLoading = ref(false);
const processLoading = ref(false);
const hasSearched = ref(false);
const baseInfoItems = ref<TraceabilityBaseOption[]>([]);
const materialItems = ref<TraceabilityMaterialInfo[]>([]);
const flowSummary = ref<TraceabilityFlowSummary | null>(null);
const stepDataMap = ref<Record<string, TraceabilityProcessRecord[]>>({});
const derivedProcessCode = ref<string | null>(null);
const isProcessCodeManuallySet = ref(false);

let serialResolveRequestId = 0;

const processOptions = computed(() => processStore.processFlow.list ?? []);
const baseInfo = computed(() => baseInfoItems.value);
const materials = computed(() => materialItems.value);
const flowSteps = computed(() => flowSummary.value?.steps ?? []);

const tableData = computed(() => {
  const steps: TraceabilityProcessStepWithData[] = flowSteps.value.map(
    step => ({
      ...step,
      data: stepDataMap.value[step.stepTypeNo] ?? []
    })
  );
  return buildTreeData(steps);
});
const recordColumns = computed(() => deriveRecordColumns(tableData.value));

watch(
  () => query.processCode,
  newValue => {
    const normalizedProcessCode = normalizeStringValue(newValue);
    const normalizedDerived = normalizeStringValue(derivedProcessCode.value);

    if (!normalizedProcessCode) {
      isProcessCodeManuallySet.value = false;
      return;
    }

    if (normalizedDerived && normalizedProcessCode === normalizedDerived) {
      isProcessCodeManuallySet.value = false;
      return;
    }

    isProcessCodeManuallySet.value = true;
  }
);

watch(
  () => query.serialNumber,
  async (newValue, oldValue) => {
    const normalizedNew = normalizeStringValue(newValue);
    const normalizedOld = normalizeStringValue(oldValue);

    if (normalizedNew === normalizedOld) {
      return;
    }

    const requestId = ++serialResolveRequestId;

    if (!normalizedNew) {
      derivedProcessCode.value = null;
      isProcessCodeManuallySet.value = false;
      if (query.processCode) {
        query.processCode = "";
      }
      return;
    }

    isProcessCodeManuallySet.value = false;

    try {
      const resolved = await resolveDefaultProcessCodeBySerial(normalizedNew);

      if (requestId !== serialResolveRequestId) {
        return;
      }

      const previousDerived = derivedProcessCode.value;
      const normalizedResolved = normalizeStringValue(resolved);
      derivedProcessCode.value = normalizedResolved;

      const normalizedCurrentProcess = normalizeStringValue(query.processCode);

      if (
        !isProcessCodeManuallySet.value ||
        !normalizedCurrentProcess ||
        normalizedCurrentProcess === previousDerived ||
        normalizedCurrentProcess === normalizedResolved
      ) {
        query.processCode = normalizedResolved ?? "";
      }
    } catch (error) {
      console.error(error);

      if (requestId !== serialResolveRequestId) {
        return;
      }

      derivedProcessCode.value = null;

      if (!isProcessCodeManuallySet.value) {
        query.processCode = "";
      }
    }
  }
);

const stageColumns: TraceabilityColumn[] = [
  { prop: "stageName", label: "工段名称" }
];

onMounted(async () => {
  await processStore.setProcessFlow();
});

async function handleSearch() {
  const serialNumber = query.serialNumber.trim();
  let processCode = query.processCode.trim();

  if (!serialNumber) {
    message("请输入序列号", { type: "error" });
    return;
  }

  loading.value = true;
  baseLoading.value = true;
  processLoading.value = false;
  hasSearched.value = true;
  baseInfoItems.value = [];
  materialItems.value = [];
  flowSummary.value = null;
  stepDataMap.value = {};

  try {
    if (!processCode) {
      const derivedProcessCode =
        await resolveDefaultProcessCodeBySerial(serialNumber);
      if (derivedProcessCode) {
        query.processCode = derivedProcessCode;
        processCode = derivedProcessCode;
      } else {
        query.processCode = "";
      }
    }

    const [baseResponse, materialsResponse] = await Promise.all([
      getTraceabilityBase({
        serialNumber,
        processCode: processCode || undefined
      }),
      getTraceabilityMaterials({ serialNumber })
    ]);

    baseInfoItems.value = baseResponse.base ?? [];
    materialItems.value = Array.isArray(materialsResponse)
      ? materialsResponse
      : [];
    flowSummary.value = baseResponse.flow ?? null;
    baseLoading.value = false;

    const steps = baseResponse.flow?.steps ?? [];
    if (steps.length > 0) {
      const effectiveSerialNumber =
        baseResponse.flow?.serialNumber ?? serialNumber;
      const effectiveProcessCode =
        baseResponse.flow?.flowCode ?? (processCode || undefined);
      const normalizedProcessCodeValue =
        typeof effectiveProcessCode === "string"
          ? effectiveProcessCode.trim()
          : undefined;
      const normalizedProcessCode =
        normalizedProcessCodeValue && normalizedProcessCodeValue.length > 0
          ? normalizedProcessCodeValue
          : undefined;

      const requests: Array<{
        stepTypeNo: string;
        request: ReturnType<typeof getTraceabilityProcess>;
      }> = [];

      steps.forEach(step => {
        const normalizedStepTypeNo =
          step.stepTypeNo?.trim?.() ?? step.stepTypeNo;
        if (!normalizedStepTypeNo) {
          return;
        }

        const params: {
          serialNumber: string;
          stepTypeNo: string;
          processCode?: string;
        } = {
          serialNumber: effectiveSerialNumber,
          stepTypeNo: normalizedStepTypeNo
        };

        if (normalizedProcessCode) {
          params.processCode = normalizedProcessCode;
        }

        requests.push({
          stepTypeNo: normalizedStepTypeNo,
          request: getTraceabilityProcess(params)
        });
      });

      if (requests.length > 0) {
        processLoading.value = true;
        const stepPromises = requests.map(({ stepTypeNo, request }) =>
          request
            .then(response => {
              const data = Array.isArray(response?.data) ? response.data : [];
              updateStepData(stepTypeNo, data);
            })
            .catch(error => {
              console.error(error);
              updateStepData(stepTypeNo, []);
            })
        );

        await Promise.allSettled(stepPromises);
      }
      processLoading.value = false;
    } else {
      processLoading.value = false;
    }
  } catch (error) {
    console.error(error);
    message("查询失败，请稍后重试", { type: "error" });
  } finally {
    loading.value = false;
    baseLoading.value = false;
    processLoading.value = false;
  }
}

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

  const options = Array.isArray(processOptions.value)
    ? processOptions.value
    : [];
  const availableCodes = new Set(
    options
      .map(option => normalizeStringValue(option?.process_code))
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

async function resolveDefaultProcessCodeBySerial(
  serialNumber: string
): Promise<string | null> {
  try {
    const materialResponse = await getTraceabilityMaterialCode({
      serialNumber
    });

    const materialCode = normalizeStringValue(materialResponse?.materialCode);
    if (!materialCode) {
      return null;
    }

    const flowResponse = await getFlowCodeByMaterial(materialCode);
    const candidateCodes = extractFlowCodes(flowResponse);
    return selectPreferredProcessCode(candidateCodes);
  } catch (error) {
    console.error(error);
    return null;
  }
}

function handleReset() {
  query.serialNumber = "";
  query.processCode = "";
  baseInfoItems.value = [];
  materialItems.value = [];
  flowSummary.value = null;
  stepDataMap.value = {};
  hasSearched.value = false;
  loading.value = false;
  baseLoading.value = false;
  processLoading.value = false;
}

function updateStepData(stepTypeNo: string, data: TraceabilityProcessRecord[]) {
  if (!stepTypeNo) return;
  stepDataMap.value = {
    ...stepDataMap.value,
    [stepTypeNo]: Array.isArray(data) ? data : []
  };
}

function buildTreeData(
  steps: TraceabilityProcessStepWithData[]
): TraceabilityTreeRow[] {
  const rows: TraceabilityTreeRow[] = [];

  steps.forEach((step, stepIndex) => {
    const records = Array.isArray(step.data) ? step.data : [];

    if (records.length === 0) {
      rows.push({
        id: `${step.stepTypeNo}-${stepIndex}`,
        stageCode: step.stageCode,
        processName: step.processName,
        stageName: step.stageName,
        stepTypeNo: step.stepTypeNo,
        __isLatest: true,
        __statusText: "暂无数据",
        children: null
      });
      return;
    }

    const sorted = [...records].sort(
      (a, b) => getComparableTime(b) - getComparableTime(a)
    );
    const [latest, ...rest] = sorted;

    const latestRow = createTreeRow(latest, step, stepIndex, 0, true);
    const childRows = rest.map((record, recordIndex) =>
      createTreeRow(record, step, stepIndex, recordIndex + 1, false)
    );
    latestRow.children = normalizeTreeChildren(childRows);

    rows.push(latestRow);
  });

  return rows;
}

function normalizeTreeChildren(
  children: TraceabilityTreeRow[] | null | undefined
): TraceabilityTreeRow[] | null {
  if (!Array.isArray(children)) {
    return null;
  }

  const [, ...restChildren] = children;
  restChildren.forEach(child => {
    child.children = normalizeTreeChildren(child.children);
  });

  return restChildren.length > 0 ? restChildren : null;
}

function deriveRecordColumns(
  rows: TraceabilityTreeRow[]
): TraceabilityColumn[] {
  const reservedKeys = new Set([
    "id",
    "children",
    "__isLatest",
    "__statusTag",
    "__statusText",
    "stageCode",
    "processName",
    "stageName",
    "stepTypeNo",
    "process",
    "status"
  ]);
  const keys = new Set<string>();

  rows.forEach(row => {
    collectKeys(row, keys, reservedKeys);
  });

  const labelMap: Record<string, string> = {
    serialNumber: "序列号",
    // process: "工序",
    timestamp: "时间",
    result: "结果",
    error_code: "错误码",
    operator: "操作人员",
    status: "状态",
    check_result: "判定结果",
    start_time: "开始时间",
    end_time: "结束时间",
    image_path: "图片路径"
  };

  return Array.from(keys).map(prop => ({
    prop,
    label: labelMap[prop] ?? formatColumnLabel(prop)
  }));
}

function collectKeys(
  row: TraceabilityTreeRow,
  keys: Set<string>,
  reserved: Set<string>
) {
  Object.keys(row).forEach(key => {
    if (!reserved.has(key)) {
      keys.add(key);
    }
  });
  if (Array.isArray(row.children)) {
    row.children.forEach(child => collectKeys(child, keys, reserved));
  }
}

function formatColumnLabel(prop: string): string {
  return prop
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createTreeRow(
  record: TraceabilityProcessRecord,
  step: TraceabilityProcessStepWithData,
  stepIndex: number,
  recordIndex: number,
  isLatest: boolean
): TraceabilityTreeRow {
  const formatted = formatRecord(record);
  const statusTag = resolveStatusTag(record);
  return {
    id: `${step.stepTypeNo || stepIndex}-${recordIndex}`,
    stageCode: step.stageCode,
    processName: step.processName,
    stageName: step.stageName,
    stepTypeNo: step.stepTypeNo,
    __isLatest: isLatest,
    __statusTag: statusTag ?? undefined,
    __statusText: statusTag?.text ?? "-",
    ...formatted
  };
}
function formatRecord(
  record: TraceabilityProcessRecord
): TraceabilityProcessRecord {
  const formatted: TraceabilityProcessRecord = {};
  Object.entries(record || {}).forEach(([key, value]) => {
    if (key === "process") {
      return;
    }
    if (value === null || value === undefined) {
      formatted[key] = "";
      return;
    }

    if (isTimeKey(key)) {
      const parsed = Date.parse(value as string);
      if (Number.isNaN(parsed)) {
        formatted[key] = String(value);
        return;
      }

      const formattedTime = formatToUTC8(parsed);
      formatted[key] = formattedTime || String(value);
      return;
    }

    if (typeof value === "object") {
      formatted[key] = JSON.stringify(value);
      return;
    }

    formatted[key] = String(value);
  });
  return formatted;
}

function resolveStatusTag(
  record: TraceabilityProcessRecord
): TraceabilityStatusTag | null {
  const source = record || {};
  const rawErrorCode =
    (source as Record<string, unknown>).error_code ??
    (source as Record<string, unknown>).errorCode;

  if (rawErrorCode === null || rawErrorCode === undefined) {
    return null;
  }

  const normalized = String(rawErrorCode).trim();
  if (!normalized) {
    return null;
  }

  const numericValue = Number(normalized);
  const isNumeric = !Number.isNaN(numericValue);
  const isSuccess = normalized === "0" || (isNumeric && numericValue === 0);

  return {
    text: isSuccess ? "通过" : "失败",
    type: isSuccess ? "success" : "danger"
  };
}

function getComparableTime(record: TraceabilityProcessRecord): number {
  const entries = Object.entries(record || {});
  for (const [key, value] of entries) {
    if (!isTimeKey(key)) continue;
    const parsed = Date.parse(value as string);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return Number.MIN_SAFE_INTEGER;
}

function isTimeKey(key: string): boolean {
  return /(time|date)$/i.test(key) || key.toLowerCase().includes("time");
}

function rowClassName({ row }: { row: TraceabilityTreeRow }) {
  return row.__isLatest ? "is-latest" : "";
}
</script>

<template>
  <div class="traceability-page">
    <el-card class="traceability-card traceability-card--filters">
      <template #header>
        <span class="traceability-card-title">查询条件</span>
      </template>
      <el-form
        :model="query"
        label-width="84px"
        class="traceability-filter-form"
      >
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="序列号">
              <el-input
                v-model="query.serialNumber"
                placeholder="请输入序列号"
                clearable
                @keyup.enter="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="工艺流程">
              <el-select
                v-model="query.processCode"
                placeholder="请选择工艺"
                clearable
                filterable
              >
                <el-option
                  v-for="item in processOptions"
                  :key="item.process_code"
                  :label="`${item.process_code} (${item.process_name})`"
                  :value="item.process_code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8">
            <el-form-item label=" " class="traceability-filter-actions">
              <el-button type="primary" @click="handleSearch" :loading="loading"
                >查询</el-button
              >
              <el-button @click="handleReset" :disabled="loading"
                >重置</el-button
              >
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card class="traceability-card">
      <template #header>
        <div class="traceability-card-header">
          <span class="traceability-card-title">工序追溯</span>
          <el-icon
            v-if="processLoading"
            class="is-loading traceability-loading-icon"
          >
            <LoadingIcon />
          </el-icon>
        </div>
      </template>
      <div class="traceability-table-wrapper">
        <el-table
          v-if="tableData.length"
          :data="tableData"
          border
          row-key="id"
          :tree-props="{ children: 'children' }"
          :row-class-name="rowClassName"
          class="traceability-table"
        >
          <el-table-column type="index" label="#" width="60" />
          <el-table-column
            v-for="column in stageColumns"
            :key="column.prop"
            :prop="column.prop"
            :label="column.label"
            min-width="140"
            show-overflow-tooltip
          />
          <el-table-column label="状态" min-width="120" align="center">
            <template #default="{ row }">
              <el-tag
                v-if="row.__statusTag"
                :type="row.__statusTag.type"
                effect="light"
              >
                {{ row.__statusTag.text }}
              </el-tag>
              <span v-else>{{ row.__statusText ?? "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-for="column in recordColumns"
            :key="column.prop"
            :prop="column.prop"
            :label="column.label"
            min-width="160"
            show-overflow-tooltip
          />
        </el-table>
        <el-empty
          v-else-if="hasSearched && !loading"
          description="暂无工序数据"
        />
        <el-empty v-else description="请先查询" />
      </div>
    </el-card>
    <el-card class="traceability-card" v-loading="baseLoading">
      <template #header>
        <span class="traceability-card-title">基本信息</span>
      </template>
      <el-row :gutter="16">
        <el-col :xs="24" :md="12" class="traceability-base-block">
          <el-descriptions
            v-if="baseInfo.length"
            :column="1"
            border
            size="small"
            class="traceability-descriptions"
          >
            <el-descriptions-item
              v-for="item in baseInfo"
              :key="item.label"
              :label="item.label"
            >
              {{ item.value ?? "-" }}
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else-if="hasSearched" description="暂无基础数据" />
          <el-empty v-else description="请先查询" />
        </el-col>
        <el-col :xs="24" :md="12" class="traceability-base-block">
          <el-table
            v-if="materials.length"
            :data="materials"
            border
            height="260"
            size="small"
          >
            <el-table-column
              prop="material"
              label="物料"
              min-width="120"
              show-overflow-tooltip
            />
            <el-table-column
              prop="batchNo"
              label="批次号"
              min-width="120"
              show-overflow-tooltip
            />
            <el-table-column
              prop="time"
              label="时间"
              min-width="160"
              show-overflow-tooltip
            />
          </el-table>
          <el-empty v-else-if="hasSearched" description="暂无物料信息" />
          <el-empty v-else description="请先查询" />
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.traceability-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.traceability-card {
  width: 100%;
}

.traceability-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.traceability-card-title {
  font-size: 16px;
  font-weight: 600;
}

.traceability-loading-icon {
  color: var(--el-color-primary);
}

.traceability-card--filters {
  .traceability-filter-form {
    padding-top: 4px;
  }

  .traceability-filter-actions {
    margin-bottom: 0;

    :deep(.el-form-item__label) {
      visibility: hidden;
    }

    :deep(.el-form-item__content) {
      display: flex;
      align-items: center;
      gap: 8px;

      .el-button {
        min-width: 80px;
      }
    }
  }
}

.traceability-base-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.traceability-block-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.traceability-descriptions {
  max-height: 260px;
  overflow-y: auto;

  :deep(.el-descriptions__label),
  :deep(.el-descriptions__content) {
    font-size: 14px;
    font-weight: 600;
  }
}

.traceability-table-wrapper {
  min-height: 320px;
}

.traceability-table {
  width: 100%;
}

.traceability-base-block :deep(.el-table__cell) {
  font-size: 14px;
  font-weight: 600;
}

.traceability-table :deep(.el-table__cell) {
  font-size: 14px;
  font-weight: 600;
}

.traceability-table :deep(.is-latest > td) {
  background-color: var(--el-color-primary-light-9);
  font-weight: 600;
}

.traceability-table :deep(td) {
  vertical-align: middle;
}
</style>
