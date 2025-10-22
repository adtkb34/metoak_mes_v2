<script setup lang="ts">
import { useSpcStore } from '@/store/modules/SPC/v1'
import SpcRuleSelector from './SpcRuleSelector.vue'
import { useSpcStorev2 } from '@/store/modules/SPC/v2'
import { computed, onActivated, onMounted, ref, watch } from 'vue';
import { getConfig, uploadConfig } from '@/api/spc';
import { maskToRules, rulesToValue } from './utils';

// const spc = useSpcStore()
const spc = useSpcStorev2();

const lengthOptions = [20, 30, 50, 100, 150]

function saveConfig() {
  const username = localStorage.getItem("username");
  uploadConfig({
    user_name: username,
    usl: spc.usl,
    lsl: spc.lsl,
    station: spc.station,
    table_name: spc.selectedStep,
    field_name: spc.selectedField,
    subgroup_length: spc.childLength,
    rules: rulesToValue(selectedRules.value),
    is_real_time: spc.isRealtime,
    position: spc.position,
    statistics_length: spc.selectedLength
  })
}

watch(
  () => spc.selectedStep,
  val => {
    spc.selectedField = ''
    spc.fetchAttrs(val);
  }
)

const config = ref(null);

watch(
  () => spc.selectedField,
  async val => {
    if (!val) {
      config.value = null
      spc.lsl = null
      spc.usl = null
      spc.isRealtime = false
      return
    }

    const username = localStorage.getItem('username')
    if (!username) return

    try {
      const res = await getConfig(username, spc.selectedStep, val)
      config.value = res

      spc.lsl = res?.lsl ?? null
      spc.usl = res?.usl ?? null
      spc.isRealtime = !!res?.is_real_time
      spc.fetchData()
    } catch (err) {
      console.error("getConfig failed:", err)
      config.value = null
      spc.lsl = null
      spc.usl = null
      spc.isRealtime = false
    }
  }
)

// 只通过 computed 来管理规则
const selectedRules = computed({
  get: () => maskToRules(config.value?.rules ?? 0),
  set: val => {
    config.value = {
      ...(config.value || {}),
      rules: rulesToValue(val)
    }
  }
})


onMounted(() => {
  spc.fetchSteps();
})
</script>

<template>
  <el-form label-width="90px" label-position="left" size="small">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="分析长度" v-if="spc.selectedStep && spc.selectedField">
          <el-select v-model="spc.selectedLength">
            <el-option v-for="opt in lengthOptions" :key="opt" :label="`最近 ${opt} 个`" :value="opt" />
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="是否实时更新数据" v-if="spc.selectedStep && spc.selectedField">
          <el-switch v-model="spc.isRealtime" />
        </el-form-item>
      </el-col>

      <!-- <el-col :span="12">
        <el-form-item label="产品">
          <el-select v-model="spc.spuId">
            <el-option v-for="item in spuOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>  -->

      <el-col :span="12">
        <el-form-item label="任务">
          <el-select v-model="spc.selectedStep">
            <el-option v-for="item in spc.stepList" :key="item.key" :label="item.label" :value="item.key" />
          </el-select>
        </el-form-item>
      </el-col>

      <!-- <el-col :span="12">
        <el-form-item label="工序">
          <el-select v-model="spc.stepId">
            <el-option v-for="item in stepOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col> -->

      <el-col :span="12">
        <el-form-item label="参数" v-if="spc.selectedStep">
          <el-select v-model="spc.selectedField">
            <el-option v-for="item in spc.attrList" :key="item.key" :label="item.label" :value="item.key" />
          </el-select>
        </el-form-item>
      </el-col>

      <!-- <el-col :span="12">
        <el-form-item label="日期范围">
          <el-date-picker v-model="spc.dateRange" type="daterange" unlink-panels range-separator="至"
            start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%" />
        </el-form-item>
      </el-col> -->

      <!-- <el-col :span="8">
        <el-form-item label="控制线" v-if="spc.selectedStep && spc.selectedField">
          <el-switch v-model="spc.showControlLines" />
        </el-form-item>
      </el-col> -->

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

      <el-col :span="8">
        <el-form-item label="子组数量" v-if="spc.selectedStep && spc.selectedField">
          <el-input-number v-model="spc.childLength" />
        </el-form-item>
      </el-col>

      <el-col :span="24">
        <el-form-item label="异常规则" v-if="spc.selectedStep && spc.selectedField">
          <SpcRuleSelector v-model="selectedRules" />
        </el-form-item>
      </el-col>
      <el-col :span="8" v-if="spc.selectedStep && spc.selectedField">
        <el-button @click="saveConfig">保存配置</el-button>
      </el-col>
    </el-row>
  </el-form>
</template>