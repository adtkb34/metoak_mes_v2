<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { getProcessSteps, getProcessFlow } from "@/api/processFlow";
import { getAllOrders } from "@/api/order";
import {
  createParamsPreset,
  getParamsNameList,
  getParamsVersionList,
  type ParamsPresetPayload
} from "@/api/params";
import { useUserListStore } from "@/store/modules/system";
import { store } from "@/store";

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
const parameterNameOptions = ref<
  Array<{ label: string; value: string | number }>
>([]);
const selectedParameterName = ref<string | number | null>(null);
const parameterVersionOptions = ref<
  Array<{ label: string; value: string | number }>
>([]);
const selectedVersion = ref<string | number | null>(null);
const nameLoading = ref(false);
const versionLoading = ref(false);

const optionLabel = computed(
  () =>
    parameterTypes.find(item => item.value === selectedType.value)?.label ??
    "关联项"
);
const optionPlaceholder = computed(() => `请选择${optionLabel.value}`);
const isProjectType = computed(() => selectedType.value === 3);

interface AddParamsForm {
  name: string;
  description: string;
  content: string;
}

const addDialogVisible = ref(false);
const addFormRef = ref<FormInstance>();
const addForm = ref<AddParamsForm>({
  name: "",
  description: "",
  content: "{}"
});
const addRules = reactive<FormRules<AddParamsForm>>({
  name: [{ required: true, message: "名称不能为空", trigger: "blur" }],
  content: [{ required: true, message: "内容不能为空", trigger: "blur" }]
});
const userStore = useUserListStore(store);

const parameterPreview = computed(() => ({
  type: optionLabel.value,
  association:
    parameterOptions.value.find(item => item.value === selectedOption.value)
      ?.label ??
    selectedOption.value ??
    "",
  parameterName:
    parameterNameOptions.value.find(
      item => item.value === selectedParameterName.value
    )?.label ??
    selectedParameterName.value ??
    "",
  version:
    parameterVersionOptions.value.find(
      item => item.value === selectedVersion.value
    )?.label ??
    selectedVersion.value ??
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
  nameLoading.value = true;
  try {
    const paramsList = await getParamsNameList({ type: 3 });
    parameterNameOptions.value = paramsList.map(item => ({
      label: item.name ?? `参数集 ${item.id}`,
      value: item.id ?? item.name ?? ""
    }));
  } catch (error) {
    ElMessage.error("获取参数集失败");
  } finally {
    nameLoading.value = false;
  }
}

async function refreshOptions(type: number) {
  selectedOption.value = null;
  selectedParameterName.value = null;
  parameterNameOptions.value = [];
  parameterVersionOptions.value = [];
  selectedVersion.value = null;
  if (type === 3) {
    parameterOptions.value = [];
    await fetchProjectParams();
    return;
  }
  if (type === 0) {
    await fetchProcessOptions();
  } else if (type === 1) {
    await fetchFlowOptions();
  } else if (type === 2) {
    await fetchWorkOrderOptions();
  }
}

async function fetchParameterNames() {
  if (!isProjectType.value && !selectedOption.value) {
    parameterNameOptions.value = [];
    selectedParameterName.value = null;
    return;
  }
  nameLoading.value = true;
  try {
    const paramsList = await getParamsNameList({
      type: selectedType.value,
      relationId: selectedOption.value
    });
    parameterNameOptions.value = paramsList.map(item => ({
      label: item.name ?? `参数集 ${item.id}`,
      value: item.id ?? item.name ?? ""
    }));
    if (!isProjectType.value) {
      const first = parameterNameOptions.value[0];
      selectedParameterName.value = first?.value ?? null;
      if (first) {
        await fetchParameterVersions(first.value);
      } else {
        selectedVersion.value = null;
        parameterVersionOptions.value = [];
      }
    }
  } catch (error) {
    ElMessage.error("获取参数名称失败");
  } finally {
    nameLoading.value = false;
  }
}

function resetAddForm() {
  addForm.value = { name: "", description: "", content: "{}" };
  addFormRef.value?.clearValidate();
}

function openAddDialog() {
  addDialogVisible.value = true;
}

function handleAddSubmit() {
  addFormRef.value?.validate(async valid => {
    if (!valid) return;
    let parsedContent: Record<string, any>;
    try {
      parsedContent = JSON.parse(addForm.value.content || "{}");
    } catch (error) {
      ElMessage.error("内容需为合法 JSON");
      return;
    }

    const payload: ParamsPresetPayload = {
      name: addForm.value.name,
      description: addForm.value.description,
      params: JSON.stringify(parsedContent),
      username: userStore.getUsername || ""
    };

    try {
      await createParamsPreset(payload);
      ElMessage.success("新增参数集成功");
      addDialogVisible.value = false;
      resetAddForm();
      await fetchParameterNames();
    } catch (error) {
      ElMessage.error((error as Error)?.message || "新增参数集失败");
    }
  });
}

function formatVersionLabel(item: {
  version?: string;
  versionMajor?: number;
  versionMinor?: number;
  versionPatch?: number;
}) {
  if (item.version) return item.version;
  const hasMajor =
    item.versionMajor !== undefined ||
    item.versionMinor !== undefined ||
    item.versionPatch !== undefined;
  if (hasMajor) {
    const major = item.versionMajor ?? 0;
    const minor = item.versionMinor ?? 0;
    const patch = item.versionPatch ?? 0;
    return `${major}.${minor}.${patch}`;
  }
  return "";
}

async function fetchParameterVersions(paramsId?: string | number | null) {
  if (!paramsId) {
    selectedVersion.value = null;
    parameterVersionOptions.value = [];
    return;
  }
  versionLoading.value = true;
  try {
    const list = await getParamsVersionList({
      type: selectedType.value,
      relationId: selectedOption.value,
      paramsId
    });
    parameterVersionOptions.value = list
      .map(item => {
        const label = formatVersionLabel(item);
        return {
          label: label || item.name || `${item.id ?? ""}`,
          value: item.id ?? label ?? item.name ?? ""
        };
      })
      .filter(item => item.value !== "");
    selectedVersion.value = parameterVersionOptions.value[0]?.value ?? null;
  } catch (error) {
    ElMessage.error("获取参数版本失败");
  } finally {
    versionLoading.value = false;
  }
}

watch(
  () => selectedType.value,
  value => {
    refreshOptions(value);
  }
);

watch(
  () => selectedOption.value,
  value => {
    if (!isProjectType.value) {
      if (value !== null) {
        fetchParameterNames();
      } else {
        parameterNameOptions.value = [];
        selectedParameterName.value = null;
        parameterVersionOptions.value = [];
        selectedVersion.value = null;
      }
    }
  }
);

watch(
  () => selectedParameterName.value,
  value => {
    if (isProjectType.value) {
      fetchParameterVersions(value);
    }
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
        <el-button type="primary" @click="openAddDialog">添加</el-button>
        <div class="card-form">
          <el-form inline>
            <el-form-item label="参数类型">
              <el-select
                v-model="selectedType"
                placeholder="请选择参数类型"
                style="width: 100px"
              >
                <el-option
                  v-for="item in parameterTypes"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="关联项" style="width: 300px">
              <el-select
                v-model="selectedOption"
                :placeholder="optionPlaceholder"
                :loading="optionLoading"
                clearable
                filterable
                :disabled="
                  isProjectType || (optionLoading && !parameterOptions.length)
                "
              >
                <el-option
                  v-for="item in parameterOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="参数名称" class="name-form-item">
              <el-select
                v-if="isProjectType"
                v-model="selectedParameterName"
                placeholder="请选择参数名称"
                :loading="nameLoading"
                :disabled="nameLoading && !parameterNameOptions.length"
                clearable
                style="width: 200px"
              >
                <el-option
                  v-for="item in parameterNameOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <p v-else class="parameter-name-text">
                {{ parameterNameOptions[0]?.label ?? "" }}
              </p>
            </el-form-item>
            <el-form-item label="参数版本" class="version-form-item">
              <el-select
                v-model="selectedVersion"
                placeholder="请选择参数版本"
                :loading="versionLoading"
                :disabled="versionLoading && !parameterVersionOptions.length"
                style="width: 200px"
              >
                <el-option
                  v-for="item in parameterVersionOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>

    <el-dialog
      v-model="addDialogVisible"
      title="新增参数集"
      width="520px"
      :close-on-click-modal="false"
      :append-to-body="true"
      @closed="resetAddForm"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        label-width="90px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="addForm.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="addForm.description" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="addForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入 JSON 格式的内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="handleAddSubmit">确 定</el-button>
        </div>
      </template>
    </el-dialog>

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
  gap: 12px;

  .card-form {
    flex: 1;
  }

  .name-form-item,
  .version-form-item {
    margin-bottom: 0;
  }

  .parameter-name-text {
    min-width: 200px;
    margin: 0;
    padding: 4px 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
  }
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
