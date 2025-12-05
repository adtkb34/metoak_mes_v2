<template>

  <el-dialog :model-value="props.visible" @update:model-value="(val) => emits('update:visible', val)" title="工单详情"
    width="800px" :destroy-on-close="true" :close-on-click-modal="false">
    <div v-if="currentOrder">
      <el-form :model="currentOrder" :rules="rules" ref="orderForm" label-width="120px" label-position="left">
        <el-form-item label="工单编号" prop="work_order_code">
          <el-input v-model="currentOrder.work_order_code"
            :disabled="!isDialogEditable || dialogType === DIALOG_TYPE.UPDATE" />
        </el-form-item>
        <el-form-item label="工单描述">
          <el-input v-model="currentOrder.description"
            :disabled="!isDialogEditable || dialogType === DIALOG_TYPE.UPDATE" />
        </el-form-item>
        <el-form-item label="产品料号" prop="material_code">
          <el-select v-model="currentOrder.material_code" placeholder="Select" filterable>
            <el-option v-for="item in materials" :key="item.material_code"
              :label="`${item.material_name} (${item.material_code})`" :value="item.material_code" />
          </el-select>
        </el-form-item>

        <el-form-item label="计划产量" prop="produce_count">
          <el-input-number v-model="currentOrder.produce_count" :disabled="!isDialogEditable" :min="0" />
        </el-form-item>
        <el-form-item label="计划开始时间" prop="planned_starttime">
          <el-date-picker v-model="currentOrder.planned_starttime" type="date" placeholder="选择日期时间"
            value-format="YYYY-MM-DD" :disabled="!isDialogEditable" />
        </el-form-item>
        <el-form-item label="计划结束时间" prop="planned_endtime">
          <el-date-picker v-model="currentOrder.planned_endtime" type="date" placeholder="选择日期时间"
            value-format="YYYY-MM-DD" :disabled="!isDialogEditable" />
        </el-form-item>
        <el-form-item label="工艺流程">
          <el-select v-model="currentOrder.flow_code" placeholder="Select" filterable>
            <el-option v-for="item in processStore.processFlow.list" :key="item.process_code"
              :label="`${item.process_code} (${item.process_name})`" :value="item.process_code" />
          </el-select>
        </el-form-item>
        <el-form-item prop="params_detail_id">
          <template #label>
            <span class="cursor-pointer text-primary" @click="paramsDialogVisible = true">参数集</span>
          </template>
          <el-select v-model="currentOrder.params_detail_id" placeholder="请选择参数集" filterable clearable
            :loading="paramsDetailLoading">
            <el-option v-for="item in paramsOptions" :key="item.id" :label="formatParamsOptionLabel(item)"
              :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="工单状态">
          <el-select v-model="currentOrder.order_state" placeholder="Select" filterable>
            <el-option v-for="item in moStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取 消</el-button>
        <el-button type="primary" @click="submit" v-if="isDialogEditable">确 定</el-button>
      </span>
    </template>
  </el-dialog>
  <el-dialog v-model="paramsDialogVisible" title="新增参数集" width="520px" :close-on-click-modal="false"
    :append-to-body="true">
    <el-form ref="paramsFormRef" :model="paramsForm" label-width="100px" :rules="paramsRules">
      <el-form-item label="名称" prop="name">
        <el-input v-model="paramsForm.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="paramsForm.description" placeholder="请输入描述" />
      </el-form-item>
      <el-form-item label="参数" prop="params">
        <el-input v-model="paramsForm.params" type="textarea" :rows="6" placeholder="请输入 JSON 格式的参数" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button @click="paramsDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleParamsSubmit">确 定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { getAllMaterilsFromK3, MaterialsInfo } from "@/api/order";
import { useOrderStore } from "@/store/modules/order";
import { useProcessStore } from "@/store/modules/processFlow";
import {
  createParamsPreset,
  getParamsDetail,
  getParamsDetailList,
  type ParamsDetail,
  type ParamsPresetPayload
} from "@/api/params";

interface ParamsFormState {
  name: string;
  description: string;
  params: string;
}

const processStore = useProcessStore();
const materials = ref<MaterialsInfo[]>([])
const paramsOptions = ref<ParamsDetail[]>([]);
const paramsDetailLoading = ref(false);
const paramsDialogVisible = ref(false);
const paramsFormRef = ref();
const paramsForm = ref<ParamsFormState>({
  name: "",
  description: "",
  params: "{}"
});
const paramsDetailMap = ref<Record<number, ParamsDetail>>({});

enum DIALOG_TYPE {
  CREATE = 'create',
  UPDATE = 'update',
  PREVIEW = 'preview'
};

const moStatusOptions = [
  { label: '计划', value: 1 },
  { label: '计划确认', value: 2 },
  { label: '下达', value: 3 },
  { label: '开工', value: 4 },
  { label: '完工', value: 5 },
  { label: '结案', value: 6 },
  { label: '结算', value: 7 },
];

const rules = {
  work_order_code: [
    { required: true, message: '工单编号不能为空', trigger: 'blur' }
  ],
  material_code: [
    { required: true, message: '产品料号不能为空', trigger: 'blur' }
  ],
  material_name: [
    { required: true, message: '产品型号不能为空', trigger: 'blur' }
  ],
  produce_count: [
    { required: true, message: '计划产量不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '计划产量必须大于等于0', trigger: 'blur' }
  ],
  planned_starttime: [
    { required: true, message: '计划开始时间不能为空', trigger: 'blur' }
  ],
  planned_endtime: [
    { required: true, message: '计划结束时间不能为空', trigger: 'blur' }
  ]
};

const paramsRules = {
  name: [{ required: true, message: "名称不能为空", trigger: "blur" }],
  description: [{ required: true, message: "描述不能为空", trigger: "blur" }],
  params: [
    {
      validator: (_: unknown, value: string, callback: Function) => {
        try {
          JSON.parse(value);
          callback();
        } catch (error) {
          callback(new Error("请输入正确的 JSON 格式"));
        }
      },
      trigger: "blur"
    }
  ]
};

const orderForm = ref(null);

const props = defineProps<{
  visible: boolean;
  dialogType: string;
}>();

const emits = defineEmits(['update:visible', 'submit']);

const orderStore = useOrderStore();

// 避免空指针：给默认值
const currentOrder = ref<Record<string, any>>({});

// 同步 store 中的 currentOrder 数据
watch(
  () => orderStore.getCurrentOrder,
  newVal => {
    if (newVal) currentOrder.value = newVal;
    ensureParamsDetailLoaded(currentOrder.value.params_detail_id);
  },
  { immediate: true }
);

// 是否可编辑（新增或编辑）
const isDialogEditable = computed(() => {
  return props.dialogType === DIALOG_TYPE.CREATE || props.dialogType === DIALOG_TYPE.UPDATE;
});


function formatVersion(detail?: Pick<ParamsDetail, "versionMajor" | "versionMinor" | "versionPatch">) {
  if (!detail) return "";
  const version = [detail.versionMajor, detail.versionMinor, detail.versionPatch]
    .filter(v => v !== undefined && v !== null)
    .join(".");
  return version ? `v${version}` : "";
}

function formatParamsOptionLabel(detail: ParamsDetail) {
  const name = detail.name || (detail.id ? `参数集 ${detail.id}` : "参数集");
  const extras = [formatVersion(detail), formatParamsPreview(detail)].filter(Boolean).join(" | ");
  return extras ? `${name} (${extras})` : name;
}

function formatParamsPreview(detail?: ParamsDetail) {
  if (!detail) return "";
  return detail.params ? JSON.stringify(detail.params) : "";
}

async function loadParamsOptions() {
  paramsDetailLoading.value = true;
  try {
    const list = await getParamsDetailList();
    paramsOptions.value = Array.isArray(list) ? list : [];
    list?.forEach(item => {
      if (item.id) {
        paramsDetailMap.value[item.id] = item;
      }
    });
  } catch (error) {
    ElMessage.error((error as Error)?.message || "获取参数集失败");
  } finally {
    paramsDetailLoading.value = false;
  }
}

async function ensureParamsDetailLoaded(id?: number | null) {
  if (!id || paramsDetailMap.value[id]) return;
  try {
    const detail = await getParamsDetail(id);
    if (detail) {
      paramsDetailMap.value[id] = detail;
      if (!paramsOptions.value.some(item => item.id === id)) {
        paramsOptions.value = [...paramsOptions.value, detail];
      }
    }
  } catch (error) {
    ElMessage.error((error as Error)?.message || "获取参数集详情失败");
  }
}


function formatYYYYMMDD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

watch(
  () => props.dialogType,
  (newDialogType) => {
    if (newDialogType === DIALOG_TYPE.CREATE) {
      currentOrder.value = {
        work_order_code: 'MO' + formatYYYYMMDD(),
        description: null,
        material_code: null,
        material_name: null,
        produce_count: null,
        planned_starttime: null,
        planned_endtime: null,
        flow_code: null,
        order_state: 4,
        params_detail_id: null,
      };
    }
  }
);

function closeDialog() {
  emits('update:visible', false);
}

function submit() {
  orderForm.value.validate((valid) => {
    if (valid) {
      const materialMap = new Map(materials.value.map(m => [m.material_code, m.material_name]));
      currentOrder.value.material_name = materialMap.get(currentOrder.value.material_code)
      currentOrder.value.planned_starttime = currentOrder.value.planned_starttime + "T00:00:00Z"
      currentOrder.value.planned_endtime = currentOrder.value.planned_endtime + "T00:00:00Z"
      emits('submit', currentOrder.value);
      console.log('表单校验通过，提交数据：', currentOrder.value);
    } else {
      console.error('表单校验失败');
    }
  });

}

function handleParamsSubmit() {
  paramsFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    let parsedParams: Record<string, any> = {};
    try {
      parsedParams = JSON.parse(paramsForm.value.params || "{}");
    } catch (error) {
      ElMessage.error("参数格式不正确");
      return;
    }

    const payload: ParamsPresetPayload = {
      name: paramsForm.value.name,
      description: paramsForm.value.description,
      params: JSON.stringify(parsedParams)
    };

    try {
      const result = await createParamsPreset(payload);
      if (result?.id) {
        currentOrder.value.params_detail_id = result.id;
      }
      paramsDialogVisible.value = false;
      await loadParamsOptions();
      if (result?.id) {
        ensureParamsDetailLoaded(result.id);
      }
      paramsForm.value = { name: "", description: "", params: "{}" };
      ElMessage.success("新增参数集成功");
    } catch (error) {
      ElMessage.error((error as Error)?.message || "新增参数集失败");
    }
  });
}



onMounted(() => {
  processStore.setProcessFlow();
  loadParamsOptions();
  getAllMaterilsFromK3().then(res => {
    materials.value = res.data;
  });
})
</script>
