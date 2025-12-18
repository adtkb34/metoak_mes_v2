<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { getProcessSteps, getProcessFlow } from "@/api/processFlow";
import { getAllOrders } from "@/api/order";
import { getParamsBaseList } from "@/api/params";

defineOptions({
  name: "ParameterManagement"
});

const parameterTypes = [
  { label: "工序", value: 0 },
  { label: "工艺", value: 1 },
  { label: "工单", value: 2 },
  { label: "工程", value: 3 }
];

const selectedType = ref<number>(parameterTypes[0].value);
const selectedOption = ref<string | number | null>(null);
const optionLoading = ref(false);
const parameterOptions = ref<Array<{ label: string; value: string | number }>>(
  []
);

const optionLabel = computed(
  () =>
    parameterTypes.find(item => item.value === selectedType.value)?.label ??
    "关联项"
);
const optionPlaceholder = computed(() => `请选择${optionLabel.value}`);

const parameterPreview = computed(() => ({
  type: optionLabel.value,
  value:
    parameterOptions.value.find(item => item.value === selectedOption.value)
      ?.label ??
    selectedOption.value ??
    ""
}));

const formattedJson = computed(() =>
  JSON.stringify(parameterPreview.value, null, 2)
);

async function fetchProcessOptions() {
  optionLoading.value = true;
  try {
    const steps = await getProcessSteps();
    parameterOptions.value = steps
      .map(step => ({
        label: step.stage_name ?? step.stage_code,
        value: step.step_type_no?.trim() ?? step.stage_code
      }))
      .filter(item => item.value);
  } catch (error) {
    ElMessage.error("获取工序失败");
  } finally {
    optionLoading.value = false;
  }
}

async function fetchFlowOptions() {
  optionLoading.value = true;
  try {
    const flows = await getProcessFlow();
    parameterOptions.value = flows.map(flow => ({
      label: `${flow.process_name ?? flow.process_code}`,
      value: (flow as any).flow_no ?? flow.process_code
    }));
  } catch (error) {
    ElMessage.error("获取工艺失败");
  } finally {
    optionLoading.value = false;
  }
}

async function fetchWorkOrderOptions() {
  optionLoading.value = true;
  try {
    const orders = await getAllOrders();
    parameterOptions.value = orders.map(order => ({
      label: `${order.work_order_code ?? order.id ?? ""}`,
      value: order.id ?? order.work_order_code
    }));
  } catch (error) {
    ElMessage.error("获取工单失败");
  } finally {
    optionLoading.value = false;
  }
}

async function fetchProjectParams() {
  optionLoading.value = true;
  try {
    const paramsList = await getParamsBaseList({ type: 3 });
    parameterOptions.value = paramsList.map(item => ({
      label: item.name ?? `参数集 ${item.id}`,
      value: item.id ?? item.name ?? ""
    }));
  } catch (error) {
    ElMessage.error("获取参数集失败");
  } finally {
    optionLoading.value = false;
  }
}

async function refreshOptions(type: number) {
  selectedOption.value = null;
  if (type === 0) {
    await fetchProcessOptions();
  } else if (type === 1) {
    await fetchFlowOptions();
  } else if (type === 2) {
    await fetchWorkOrderOptions();
  } else if (type === 3) {
    await fetchProjectParams();
  } else {
    parameterOptions.value = [];
  }
}

watch(
  () => selectedType.value,
  value => {
    refreshOptions(value);
  }
);

onMounted(async () => {
  await refreshOptions(selectedType.value);
});
</script>

<template>
  <div class="parameter-management-page">
    <el-card class="parameter-type-card" shadow="never">
      <div class="card-content">
        <el-form inline>
          <el-form-item label="参数类型">
            <el-select v-model="selectedType" placeholder="请选择参数类型">
              <el-option
                v-for="item in parameterTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="关联项">
            <el-select
              v-model="selectedOption"
              :placeholder="optionPlaceholder"
              :loading="optionLoading"
              clearable
              filterable
              :disabled="optionLoading && !parameterOptions.length"
            >
              <el-option
                v-for="item in parameterOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <el-card class="parameter-json-card" shadow="never">
      <template #header>
        <span>参数内容</span>
      </template>
      <pre class="json-viewer">{{ formattedJson }}</pre>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.parameter-management-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.parameter-type-card {
  min-height: 84px;

  .el-card__body {
    padding: 12px 16px;
  }
}

.card-content {
  display: flex;
  align-items: center;
}

.parameter-json-card {
  .json-viewer {
    margin: 0;
    padding: 12px 14px;
    background-color: #f5f7fa;
    border-radius: 4px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>
