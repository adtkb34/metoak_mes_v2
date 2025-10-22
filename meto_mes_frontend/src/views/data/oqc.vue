<script lang="ts" setup>
import { getCameraSN, PackingInfo } from "@/api/warehouse";
import { useWarehouseStoreHook } from "@/store/modules/warehouse";
import { isDateEmpty } from "@/utils/date";
import { onMounted, ref } from "vue";

const packingInfos = ref<PackingInfo[]>();
const packingCameras = ref();

const DATE_RANGE = 7;

const now = new Date();
const dateRange = ref<[Date, Date]>([
  new Date(now.getFullYear(), now.getMonth(), now.getDate() - DATE_RANGE),
  new Date(now.getFullYear(), now.getMonth(), now.getDate())
]);

const warehouseStore = useWarehouseStoreHook();

const updateDate = () => {
  if (isDateEmpty(dateRange)) return;

  const [start, end] = [
    dateRange.value[0].toString(),
    dateRange.value[1].toString()
  ];
  warehouseStore.setDate(start, end);
};

const updatePackingInfos = async () => {
  updateDate();
  warehouseStore.setPackages();
};

const handlePreview = async row => {
  packingCameras.value = await getCameraSN(row.packing_code);
};

onMounted(async () => {});
</script>

<template>
  <div class="flex flex-col w-full h-1/2 pr-15">
    <el-card class="mr-10">
      <template #header>
        <div class="flex flex-row items-center justify-start">
          <span class="mr-5"> OQC测距退化 </span>
          <div>
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="~"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              :default-value="dateRange"
              value-format="YYYY-MM-DD"
              @change="updatePackingInfos"
            />
          </div>
        </div>
      </template>
      <el-table
        :data="warehouseStore.packages"
        height="680"
        style="width: 100%"
      >
        <el-table-column fixed prop="id" type="index" align="center" />
        <el-table-column prop="packing_code" label="产品类型" align="center" />
        <el-table-column prop="operator" label="检查总数" align="center" />
        <el-table-column prop="start_time" label="退化数" align="center" />
        <el-table-column prop="num" label="退化率" align="center" />
      </el-table>
    </el-card>
    <el-card class="mt-5 mr-10">
      <el-table :data="packingCameras" height="680">
        <el-table-column fixed prop="id" type="index" />
        <el-table-column prop="camera_sn" label="退化SN列表" />
      </el-table>
    </el-card>
  </div>
</template>
