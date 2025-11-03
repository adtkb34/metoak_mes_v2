<script setup lang="ts">
import SpcRuleSelector from './SpcRuleSelector.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { getConfig, uploadConfig } from '@/api/spc'
import { maskToRules, rulesToValue } from './utils'
import { STEP_NO } from '@/enums/step-no';

// 从父组件传入当前面板的 spc 实例
const props = defineProps<{
  spc: ReturnType<ReturnType<typeof import('@/store/modules/SPC/v2').createSpcStore>>
}>()

const spc = props.spc
const config = ref<any>(null)

const lengthOptions = [20, 30, 50, 100, 150, 300]


// 规则选择（使用计算属性做映射）
const selectedRules = computed<string[]>({
  get() {
    // 优先使用 store 内已选规则，否则从后端配置 mask 解出
    if (spc.selectedRules && spc.selectedRules.length > 0) {
      return spc.selectedRules
    }
    return maskToRules(config.value?.rules ?? 0)
  },
  set(val) {
    // 同步给 store 和 config
    spc.selectedRules = val
    if (!config.value) config.value = {}
    config.value.rules = rulesToValue(val)
  },
})

// 保存配置
async function saveConfig() {
  const username = localStorage.getItem('username');
  if (!username) return;

  await uploadConfig({
    user_name: username,
    table_name: spc.selectedStep,
    field_name: spc.selectedField,
    subgroup_length: spc.childLength,
    usl: spc.usl,
    lsl: spc.lsl,
    is_real_time: spc.isRealtime,
    statistics_length: spc.selectedLength,
    rules: rulesToValue(selectedRules.value),
  });
}

// 拉取配置
watch(
  () => [spc.selectedStep, spc.selectedField],
  async ([step, field]) => {
    if (!step || !field) {
      config.value = null
      return
    }
    const username = localStorage.getItem('username')
    if (!username) return
    try {
      const res = await getConfig(username, step, field)
      config.value = res
      // 同步到 store
      spc.selectedRules = maskToRules(res?.rules ?? 0)
    } catch (e) {
      config.value = null
      spc.selectedRules = []
    }
  },
  { immediate: true }
)

// ---------------- 动态联动逻辑 ----------------
watch(
  () => spc.selectedStep,
  (val) => {
    spc.selectedField = ''
    if (val) spc.fetchAttrs(val)
  }
)

watch(
  () => [spc.selectedField, spc.selectedPosition, spc.selectedStation, spc.selectedLength, spc.stage],
  async (val) => {
    const [field] = val
    if (!field) {
      config.value = null
      spc.lsl = null
      spc.usl = null
      spc.isRealtime = false
      return
    }

    const username = localStorage.getItem('username')
    if (!username) return

    try {
      const res = await getConfig(username, spc.selectedStep, field as string)
      config.value = res

      spc.lsl = res?.lsl ?? null
      spc.usl = res?.usl ?? null
      spc.isRealtime = !!res?.is_real_time
      spc.fetchData()
    } catch (err) {
      console.error('getConfig failed:', err)
      config.value = null
      spc.lsl = null
      spc.usl = null
      spc.isRealtime = false
    }
  }
)

// ---------------- 地区筛选逻辑 ----------------
const stations = [
  { label: '广浩捷', value: '1' },
  { label: '舜宇', value: '2' },
  { label: '艾薇视', value: '3' },
]

const filteredStations = computed(() => {
  if (spc.origin === '1') {
    spc.selectedStation = '1'
    return stations.slice(0, 2)
  } else if (spc.origin === '2') {
    spc.selectedStation = '3'
    return stations.slice(-1)
  }
  return stations
})

// 通过计算属性取当前任务和参数的显示名
const currentStepLabel = computed(() => {
  return spc.stepList.find(i => i.key === spc.selectedStep)?.label || spc.selectedStep || ''
})
const currentAttrLabel = computed(() => {
  return spc.attrList.find(i => i.key === spc.selectedField)?.label || spc.selectedField || ''
})

// ---------------- 初始化 ----------------
onMounted(async () => {
  await spc.fetchSteps()
  if (spc.selectedStep) await spc.fetchAttrs(spc.selectedStep)
})
</script>

<template>
  <el-card class="spc-control-panel" shadow="never">
    <!-- <template #header>
      <div class="panel-header">
        <span>
          控制面板
          <template v-if="spc.selectedStep && spc.selectedField">
            - {{ currentStepLabel }} : {{ currentAttrLabel }}
          </template>
        </span>
      </div>
    </template> -->
    <el-form label-width="90px" label-position="left" size="small">
      <el-row :gutter="20">
        <!-- 分析长度 -->
        <el-col :span="12">
          <el-form-item label="分析长度" v-if="spc.selectedStep && spc.selectedField">
            <el-select v-model="spc.selectedLength">
              <el-option v-for="opt in lengthOptions" :key="opt" :label="`最近 ${opt} 个`" :value="opt" />
            </el-select>
          </el-form-item>
        </el-col>

        <!-- 实时更新 -->
        <el-col :span="12">
          <el-form-item label="实时更新" v-if="spc.selectedStep && spc.selectedField">
            <el-switch v-model="spc.isRealtime" />
          </el-form-item>
        </el-col>

        <!-- 任务 -->
        <el-col :span="12">
          <el-form-item label="任务">
            <el-select v-model="spc.selectedStep">
              <el-option v-for="item in spc.stepList" :key="item.key" :label="item.label" :value="item.key" />
            </el-select>
          </el-form-item>
        </el-col>

        <!-- 参数 -->
        <el-col :span="12">
          <el-form-item label="参数" v-if="spc.selectedStep">
            <el-select v-model="spc.selectedField">
              <el-option v-for="item in spc.attrList" :key="item.key" :label="item.label" :value="item.key" />
            </el-select>
          </el-form-item>
        </el-col>

        <!-- USL / LSL -->
        <el-col :span="8">
          <el-form-item label="USL" v-if="spc.selectedStep && spc.selectedField">
            <el-input-number v-model="spc.usl" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="LSL" v-if="spc.selectedStep && spc.selectedField">
            <el-input-number v-model="spc.lsl" />
          </el-form-item>
        </el-col>

        <!-- 地区 / 设备 -->
        <el-col :span="8">
          <el-form-item label="地区" v-if="spc.selectedStep && spc.selectedField">
            <el-select v-model="spc.origin" placeholder="请选择地区">
              <el-option label="苏州" value="1" />
              <el-option label="绵阳" value="2" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8" v-show="spc.selectedStep === STEP_NO.AUTO_ADJUST">
          <el-form-item label="设备" v-if="spc.selectedStep && spc.selectedField">
            <el-select v-model="spc.selectedStation" placeholder="请选择设备">
              <el-option v-for="station in filteredStations" :key="station.value" :label="station.label"
                :value="station.value" />
            </el-select>
          </el-form-item>
        </el-col>

        <!-- 阶段 / 位置 -->
        <el-col :span="8" v-show="spc.selectedStep === STEP_NO.AUTO_ADJUST">
          <el-form-item label="阶段" v-if="spc.selectedStep && spc.selectedField">
            <el-select v-model="spc.stage">
              <el-option label="UV前" value="1" />
              <el-option label="UV后" value="2" />
              <el-option label="松开夹爪" value="3" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8" v-show="spc.selectedStep === STEP_NO.AUTO_ADJUST">
          <el-form-item label="位置" v-if="spc.selectedStep && spc.selectedField">
            <el-select v-model="spc.selectedPosition">
              <el-option label="左" value="1" />
              <el-option label="右" value="2" />
            </el-select>
          </el-form-item>
        </el-col>

        <!-- 子组数 -->
        <el-col :span="8">
          <el-form-item label="子组数量" v-if="spc.selectedStep && spc.selectedField">
            <el-input-number v-model="spc.childLength" />
          </el-form-item>
        </el-col>

        <!-- 规则 -->
        <el-form-item label="异常规则" v-if="spc.selectedStep && spc.selectedField">
          <SpcRuleSelector v-model="selectedRules" />
        </el-form-item>

        <!-- 保存按钮 -->
        <el-form-item v-if="spc.selectedField">
          <el-button type="primary" @click="saveConfig">保存配置</el-button>
        </el-form-item>
      </el-row>
    </el-form>
  </el-card>
</template>
