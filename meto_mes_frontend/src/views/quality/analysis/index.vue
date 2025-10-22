<script lang="ts" setup>
import { getMachine, getQualityData, getQualityErrorData } from "@/api/quality";
import { onMounted, ref } from "vue";
import QualityDataForm from "../components/QualityDataForm.vue";
import QualityErrorChart from "../components/QualityErrorChart.vue";
import { NormalizedItemWithDesc, QualityFormData } from "types/quality";
import ErrorAnalysisForm from "../components/ErrorAnalysisForm.vue";
import { normalizeData, sortData } from "../utils";
import { isDateEmpty } from "@/utils/date";
import ErrorAnalysisFormV2 from "../components/ErrorAnalysisFormV2.vue";

defineOptions({
  name: "QualityAnalysis"
});

const enableChart = ref(false)
const selectedMaterial = ref('normal')
const tableData = ref([])
const machine = ref([])

const now = new Date();
const dateRange = ref<[Date, Date]>([
  new Date(now.getFullYear(), now.getMonth(), now.getDay()),
  new Date(now.getFullYear(), now.getMonth(), now.getDay())
]);

const listData = ref<QualityFormData[]>([]);
const resetListData = () => (listData.value = []);

const handleDateChange = () => {
  updateListDate();
};

const updateListDate = async () => {
  if (isDateEmpty(dateRange)) return;

  const [start, end] = dateRange.value.map(item => item.toString());
  const qualityData = await getQualityData(start, end);

  resetListData();

  Object.keys(qualityData).forEach(key => {
    const { total, onePass, qualified } = qualityData[key];
    const defects = total - qualified;

    listData.value.push({
      passRate: total === 0 ? 0 : onePass / total,
      qualificationRate: total === 0 ? 0 : qualified / total,
      defects,
      total
    });
  });
};

const errorDateRange = ref<[Date, Date]>([
  new Date(now.getFullYear(), now.getMonth(), now.getDay()),
  new Date(now.getFullYear(), now.getMonth(), now.getDay())
]);

const errorList = ref<NormalizedItemWithDesc[]>();
const sortedErrorList = ref();

const updateErrorList = async () => {
  if (isDateEmpty(errorDateRange)) return;

  const [start, end] = errorDateRange.value.map(item => item.toString());
  const listData = await getQualityErrorData(start, end);
  errorList.value = normalizeData(listData);
  sortedErrorList.value = sortData(errorList.value);
};

onMounted(async () => {
  updateListDate();
  console.log(res);
  
  // if (res && res?.data) {
  //   machine.value = res.data
  // }
});
</script>

<template>
  <div class="flex flex-row h-[85vh]">
    <div class="flex flex-col px-5 w-1/2">
      <el-card class="w-auto">
        <template #header>
          <div class="flex flex-row items-center justify-start">
            <span class="mr-5"> 品质分析 </span>
            <div>
              <el-date-picker v-model="dateRange" type="datetimerange" range-separator="~" start-placeholder="开始时间"
                end-placeholder="结束时间" :default-value="dateRange" value-format="YYYY-MM-DD"
                @change="handleDateChange" />
            </div>
          </div>
        </template>
        <div>
          <ErrorAnalysisFormV2 v-if="!selectedMaterial" :data="tableData"></ErrorAnalysisFormV2>
          <QualityDataForm v-else :list-data="listData" />
        </div>
      </el-card>
      <el-card class="flex-1 mt-5">
        <template #header>
          <div class="flex flex-row items-center justify-start">
            <span class="mr-5"> 不良统计 </span>
            <div>
              <el-date-picker v-model="errorDateRange" type="datetimerange" range-separator="~" start-placeholder="开始时间"
                end-placeholder="结束时间" :default-value="errorDateRange" value-format="YYYY-MM-DD"
                @change="updateErrorList" />
            </div>
          </div>
        </template>
        <div>
          <ErrorAnalysisForm :list-data="errorList" />
        </div>
      </el-card>
    </div>
    <div class="flex-1 flex flex-col mr-5">
      <el-card class="w-full flex-1">
        <template #header>
          <div class="flex flex-row items-center justify-start">
            <span class="mr-5"> 不良原因分类占比 </span>
          </div>
        </template>
        <QualityErrorChart :charts-data="sortedErrorList" />
      </el-card>
    </div>
  </div>
</template>
