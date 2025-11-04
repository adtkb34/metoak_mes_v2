<template>
  <div class="parameter-form-page">
    <el-card class="parameter-form">
      <template #header>
        <div class="parameter-form__header">
          <span>{{ pageTitle }}</span>
          <div class="parameter-form__header-actions">
            <el-button @click="handleBack">返回</el-button>
            <el-button type="primary" :loading="saving" @click="handleSave"
              >保存</el-button
            >
          </div>
        </div>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入参数配置名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="类型" prop="type">
            <el-select v-model="form.type" placeholder="请选择类型">
              <el-option
                v-for="item in typeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="产品" prop="product">
            <el-select v-model="form.product" placeholder="请选择产品">
              <el-option
                v-for="item in productOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="工序" prop="process">
            <el-select v-model="form.process" placeholder="请选择工序">
              <el-option
                v-for="item in processOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="版本" prop="version">
            <el-input v-model="form.version" placeholder="请输入版本信息" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择状态">
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请输入描述"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>

      <el-divider>参数配置</el-divider>
      <div class="parameter-tree__toolbar">
        <el-space>
          <el-button type="primary" @click="openParameterDialog('add')"
            >添加</el-button
          >
          <el-button :disabled="!currentNode" @click="openParameterDialog('edit')"
            >编辑</el-button
          >
          <el-button
            type="danger"
            :disabled="!currentNode"
            @click="handleDeleteNode"
            >删除</el-button
          >
        </el-space>
        <span class="parameter-tree__tip"
          >请选择一行进行编辑或删除，支持新增子节点</span
        >
      </div>
      <el-table
        :data="form.parameters"
        row-key="id"
        border
        default-expand-all
        highlight-current-row
        style="width: 100%"
        :tree-props="{ children: 'children' }"
        @current-change="handleNodeChange"
      >
        <el-table-column prop="name" label="名称" min-width="200" />
        <el-table-column
          prop="description"
          label="描述"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column prop="unit" label="单位" min-width="120" />
        <el-table-column prop="value" label="数值" min-width="160" />
      </el-table>
    </el-card>

    <el-dialog
      v-model="parameterDialogVisible"
      :title="parameterDialogTitle"
      width="480px"
    >
      <el-form
        ref="parameterFormRef"
        :model="parameterForm"
        :rules="parameterRules"
        label-width="100px"
      >
        <el-form-item
          v-if="parameterDialogMode === 'add' && pendingParentId"
          label="添加方式"
        >
          <el-switch
            v-model="addAsChild"
            active-text="添加为子参数"
            inactive-text="添加为根参数"
          />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="parameterForm.name" placeholder="请输入参数名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="parameterForm.description"
            placeholder="请输入参数描述"
          />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="parameterForm.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="数值" prop="value">
          <el-input v-model="parameterForm.value" placeholder="请输入参数数值" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="parameterDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleParameterConfirm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  createParameterConfig,
  getParameterConfigDetail,
  getParameterOptions,
  updateParameterConfig
} from "@/api/parameter";
import type {
  ParameterConfig,
  ParameterNode,
  ParameterOptions
} from "types/parameter";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";

const router = useRouter();
const route = useRoute();

const form = reactive<ParameterConfig>({
  id: "",
  name: "",
  type: 1,
  product: "",
  process: "",
  version: "",
  description: "",
  status: 1,
  parameters: []
});

const productOptions = ref<ParameterOptions["products"]>([]);
const processOptions = ref<ParameterOptions["processes"]>([]);

const typeOptions = [
  { label: "工艺", value: 1 },
  { label: "工程", value: 2 }
] as const;

const statusOptions = [
  { label: "启用", value: 1 },
  { label: "停用", value: 2 }
] as const;

const rules = reactive<FormRules>({
  name: [
    { required: true, message: "请输入名称", trigger: "blur" },
    { pattern: /^[A-Za-z_]+$/, message: "仅支持英文和下划线", trigger: "blur" }
  ],
  type: [{ required: true, message: "请选择类型", trigger: "change" }],
  product: [{ required: true, message: "请选择产品", trigger: "change" }],
  process: [{ required: true, message: "请选择工序", trigger: "change" }],
  version: [{ required: true, message: "请输入版本信息", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
  description: [{ required: true, message: "请输入描述", trigger: "blur" }]
});

const parameterDialogVisible = ref(false);
const parameterDialogMode = ref<"add" | "edit">("add");
const currentNode = ref<ParameterNode>();
const pendingParentId = ref<string | null>(null);
const addAsChild = ref(false);
const parameterForm = reactive<ParameterNode>({
  id: "",
  name: "",
  description: "",
  unit: "",
  value: "",
  children: []
});
const parameterRules = reactive<FormRules>({
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  value: [{ required: true, message: "请输入数值", trigger: "blur" }]
});

const parameterDialogTitle = computed(() => {
  if (parameterDialogMode.value === "edit") {
    return "编辑参数";
  }
  return addAsChild.value && pendingParentId.value ? "新增子参数" : "新增参数";
});

const formRef = ref<FormInstance>();
const parameterFormRef = ref<FormInstance>();
const saving = ref(false);

const isEdit = computed(() => route.name === "ParameterConfigEdit");
const pageTitle = computed(() =>
  isEdit.value ? "编辑参数配置" : "新增参数配置"
);

const fetchOptions = async () => {
  try {
    const data = await getParameterOptions();
    productOptions.value = data.products;
    processOptions.value = data.processes;
  } catch (error) {
    ElMessage.error("获取下拉选项失败");
  }
};

const resetForm = () => {
  form.id = "";
  form.name = "";
  form.type = 1;
  form.product = "";
  form.process = "";
  form.version = "";
  form.description = "";
  form.status = 1;
  form.parameters = [];
  currentNode.value = undefined;
  pendingParentId.value = null;
  addAsChild.value = false;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

const loadDetail = async (id: string) => {
  try {
    const data = await getParameterConfigDetail(id);
    Object.assign(form, data);
    form.parameters = Array.isArray(data.parameters)
      ? [...data.parameters]
      : [];
    currentNode.value = undefined;
    pendingParentId.value = null;
    addAsChild.value = false;
    nextTick(() => {
      formRef.value?.clearValidate();
    });
  } catch (error) {
    ElMessage.error("获取参数配置详情失败");
    handleBack();
  }
};

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const openParameterDialog = (mode: "add" | "edit") => {
  parameterDialogMode.value = mode;
  if (mode === "edit") {
    if (!currentNode.value) {
      ElMessage.warning("请选择需要编辑的参数");
      return;
    }
    Object.assign(parameterForm, {
      id: currentNode.value.id,
      name: currentNode.value.name,
      description: currentNode.value.description ?? "",
      unit: currentNode.value.unit ?? "",
      value: currentNode.value.value ?? ""
    });
    addAsChild.value = false;
    pendingParentId.value = currentNode.value.id;
  } else {
    Object.assign(parameterForm, {
      id: "",
      name: "",
      description: "",
      unit: "",
      value: ""
    });
    pendingParentId.value = currentNode.value ? currentNode.value.id : null;
    addAsChild.value = !!currentNode.value;
  }
  parameterDialogVisible.value = true;
  nextTick(() => {
    parameterFormRef.value?.clearValidate();
  });
};

const handleNodeChange = (row?: ParameterNode) => {
  currentNode.value = row;
};

const appendNode = (
  nodes: ParameterNode[],
  parentId: string | null,
  node: ParameterNode
) => {
  if (!parentId) {
    nodes.push(node);
    return true;
  }
  for (const item of nodes) {
    if (item.id === parentId) {
      item.children = item.children ? [...item.children, node] : [node];
      return true;
    }
    if (item.children && appendNode(item.children, parentId, node)) {
      item.children = [...item.children];
      return true;
    }
  }
  return false;
};

const updateNode = (
  nodes: ParameterNode[],
  nodeId: string,
  payload: Partial<ParameterNode>
) => {
  for (const item of nodes) {
    if (item.id === nodeId) {
      Object.assign(item, payload);
      return true;
    }
    if (item.children && updateNode(item.children, nodeId, payload)) {
      return true;
    }
  }
  return false;
};

const removeNode = (nodes: ParameterNode[], nodeId: string): boolean => {
  const index = nodes.findIndex(item => item.id === nodeId);
  if (index !== -1) {
    nodes.splice(index, 1);
    return true;
  }
  for (const item of nodes) {
    if (item.children && removeNode(item.children, nodeId)) {
      item.children = [...item.children];
      return true;
    }
  }
  return false;
};

const handleParameterConfirm = () => {
  parameterFormRef.value?.validate(valid => {
    if (!valid) return;
    if (parameterDialogMode.value === "add") {
      const newNode: ParameterNode = {
        id: generateId(),
        name: parameterForm.name,
        description: parameterForm.description,
        unit: parameterForm.unit,
        value: parameterForm.value
      };
      const parentId =
        addAsChild.value && pendingParentId.value
          ? pendingParentId.value
          : null;
      appendNode(form.parameters, parentId, newNode);
      currentNode.value = newNode;
    } else if (currentNode.value) {
      updateNode(form.parameters, currentNode.value.id, {
        name: parameterForm.name,
        description: parameterForm.description,
        unit: parameterForm.unit,
        value: parameterForm.value
      });
      currentNode.value = {
        ...currentNode.value,
        name: parameterForm.name,
        description: parameterForm.description,
        unit: parameterForm.unit,
        value: parameterForm.value
      };
    }
    parameterDialogVisible.value = false;
  });
};

const handleDeleteNode = () => {
  if (!currentNode.value) {
    ElMessage.warning("请选择需要删除的参数");
    return;
  }
  ElMessageBox.confirm("确认删除当前参数？", "提示", { type: "warning" })
    .then(() => {
      removeNode(form.parameters, currentNode.value!.id);
      currentNode.value = undefined;
      pendingParentId.value = null;
      addAsChild.value = false;
    })
    .catch(() => false);
};

const handleSave = () => {
  formRef.value?.validate(async valid => {
    if (!valid) return;
    saving.value = true;
    const payload: ParameterConfig = {
      ...form,
      parameters: JSON.parse(JSON.stringify(form.parameters))
    };
    try {
      if (isEdit.value) {
        if (!payload.id) {
          ElMessage.error("缺少参数配置ID");
          saving.value = false;
          return;
        }
        await updateParameterConfig(payload.id, payload);
        ElMessage.success("更新成功");
      } else {
        payload.id = payload.id || generateId();
        form.id = payload.id;
        await createParameterConfig(payload);
        ElMessage.success("创建成功");
      }
      handleBack();
    } catch (error) {
      ElMessage.error(isEdit.value ? "更新参数配置失败" : "创建参数配置失败");
    } finally {
      saving.value = false;
    }
  });
};

const handleBack = () => {
  router.push({ name: "ParameterConfigs" });
};

onMounted(async () => {
  await fetchOptions();
  if (isEdit.value) {
    const id = route.params.id as string;
    if (id) {
      await loadDetail(id);
    }
  } else {
    resetForm();
  }
});

watch(
  () => route.fullPath,
  async () => {
    if (route.name === "ParameterConfigCreate") {
      resetForm();
    } else if (route.name === "ParameterConfigEdit") {
      const id = route.params.id as string;
      if (id) {
        await loadDetail(id);
      }
    }
  }
);
</script>

<style scoped>
.parameter-form-page {
  padding: 16px 24px;
}

.parameter-form {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.parameter-form :deep(.el-card__body) {
  padding: 24px;
}

.parameter-form__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.parameter-form__header-actions {
  display: flex;
  gap: 12px;
}

.parameter-tree__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.parameter-tree__tip {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
