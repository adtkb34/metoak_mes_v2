<script setup lang="ts">
import { getDataByMachine, getFlowCodeByMaterial, getMachine, getOthersDataErrorCodes } from '@/api/quality'
import { onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import ErrorAnalysisFormV2 from '../components/ErrorAnalysisFormV2.vue'

interface Material {
  material_code: string
  material_name: string
}

interface Flow {
  flow_code: string
  flow_name: string
}

const materials = ref<Material[]>([])
const selectedMaterial = ref<string>('') // 物料编码

const flows = ref<Flow[]>([])            // 工艺数组
const selectedFlow = ref<string>('')     // 选中的工艺编码

// 子组件需要的数据
const analysisData = ref<any[]>([])


// 新增日期区间（数组，Element Plus 的 v-model 就是这样）
const dateRange = ref<[string, string] | []>([])

// 抽出获取分析数据的方法
const fetchAnalysisData = async () => {
  analysisData.value = []
  if (!selectedFlow.value || !selectedMaterial.value) return

  // 取日期
  const [startDate, endDate] = (dateRange.value as [string, string]) || []

  let res;
  if (selectedFlow.value) {
    res = await getDataByMachine({
      material_code: selectedMaterial.value,
      flow_code: selectedFlow.value,
      startTime: startDate,
      endTime: endDate
    })
  }


  if (res && res?.data) {
    analysisData.value = res.data
    console.log(analysisData.value);
    
  }
}

// 监听工艺变化
watch(() => selectedFlow.value, fetchAnalysisData)

// 监听物料变化 -> 获取对应工艺
watch(() => selectedMaterial.value, async (val) => {
  selectedFlow.value = '' // 清空工艺选择
  analysisData.value = [] // 清空错误码
  if (!val) {
    flows.value = []
    return
  }
  const res = await getFlowCodeByMaterial(val)
  if (res && res?.data) {
    // 后端返回 [{flow_code:'F001',flow_name:'工艺A'},...]
    const uniqueFlows: any = Array.from(
      new Map(
        res.data.map((item: any) => [item.flow_code, item]) // 按 flow_code 去重
      ).values()
    )
    flows.value = uniqueFlows
  }

  selectedFlow.value = flows.value[0].flow_code
})

// 监听工艺变化 -> 获取对应错误码
watch(() => selectedFlow.value, async (val) => {
  analysisData.value = [] // 重置数据
  if (!val || !selectedMaterial.value) return
  // 传参示例：物料+工艺编码
  console.log(selectedMaterial.value)
  const res = await getDataByMachine({
    material_code: selectedMaterial.value,
    flow_code: val
  })
  if (res && res?.data) {
    analysisData.value = res.data
  }
})

// 页面加载 -> 获取物料
onMounted(async () => {
  const res = await getMachine()
  if (res && res?.data) {
    materials.value = res.data
  }
})
</script>

<template>
  <el-card>
    <template #header>
      <el-form class="flex flex-row justify-start space-x-3 mt-2">
        <!-- 物料选择 -->
        <el-form-item label="选择物料">
          <el-select v-model="selectedMaterial" placeholder="请选择物料" style="width: 240px;" filterable>
            <el-option v-for="item in materials" :key="item.material_code"
              :label="`${item.material_name} - ${item.material_code}`" :value="item.material_code" />
          </el-select>
        </el-form-item>

        <!-- 工艺选择 -->
        <el-form-item label="选择工艺">
          <el-select v-model="selectedFlow" placeholder="请选择工艺" style="width: 240px;" :disabled="flows.length === 0">
            <el-option v-for="flow in flows" :key="flow.flow_code" :label="`${flow.flow_name} - ${flow.flow_code}`"
              :value="flow.flow_code" />
          </el-select>
        </el-form-item>

        <!-- 日期区间选择 -->
        <el-form-item label="选择日期">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
            end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 260px;" />
        </el-form-item>

        <el-button type="primary" @click="fetchAnalysisData">查询</el-button>
      </el-form>
    </template>

    <!-- 把接口数据传给子组件 -->
    <ErrorAnalysisFormV2 :data="analysisData" />
  </el-card>
</template>

<style lang="scss" scoped>
/* 根据需要调整样式 */
</style>
