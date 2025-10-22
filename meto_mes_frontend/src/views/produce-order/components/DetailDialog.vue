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
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useOrderStore } from "@/store/modules/order";
import { getAllMaterilsFromK3, MaterialsInfo } from "@/api/order";
import { useProcessStore } from "@/store/modules/processFlow";

const processStore = useProcessStore();
const materials = ref<MaterialsInfo[]>([])

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
  },
  { immediate: true }
);

// 是否可编辑（新增或编辑）
const isDialogEditable = computed(() => {
  return props.dialogType === DIALOG_TYPE.CREATE || props.dialogType === DIALOG_TYPE.UPDATE;
});


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



onMounted(() => {
  processStore.setProcessFlow();
  getAllMaterilsFromK3().then(res => {
    materials.value = res.data;
  });
})
</script>
