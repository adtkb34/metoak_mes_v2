<template>
  <div class="flex flex-row w-full pr-15">
    <el-card class="flex-1 mr-10">
      <template #header>
        <el-tabs v-model="activeTab" class="mb-4">
          <el-tab-pane label="按 SN 查询" name="sn" />
          <el-tab-pane label="按时间+箱号查询" name="time" />
        </el-tabs>

        <!-- 按 SN 查询 -->
        <div v-if="activeTab === 'sn'">
          <el-input v-model="cameraSNInput" type="textarea" placeholder="请输入一个或多个相机 SN（支持换行或逗号分隔）" :rows="3"
            style="width: 320px" @input="throttleUpdatePackingInfos" clearable />
        </div>

        <!-- 按时间+箱号查询 -->
        <div v-else class="flex gap-2 items-center">
          <!-- <el-date-picker v-model="dateRange" type="datetimerange" range-separator="~" start-placeholder="开始时间"
            end-placeholder="结束时间" value-format="YYYY-MM-DDTHH:mm:ss" @change="throttleUpdatePackingInfos" /> -->
          <el-input v-model="packingCode" type="textarea" placeholder="请输入箱号" style="width: 180px"
            @input="throttleUpdatePackingInfos" clearable />
          <el-button type="primary" @click="updatePackingInfos">查询</el-button>
        </div>

      </template>
      <el-table :data="warehouseStore.packages" max-height="580" style="width: 100%">
        <el-table-column fixed prop="id" type="index" align="center" />
        <el-table-column prop="packing_code" label="箱号" align="center" />
        <el-table-column prop="operator" label="操作人员" align="center" />
        <el-table-column prop="start_time" label="操作时间" align="center" />
        <el-table-column prop="num" label="产品数量" align="center" />
        <el-table-column fixed="right" label="操作" min-width="120" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="handlePreview(scope.row)">
              查看整机标签
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 标签侧边 -->
    <el-card class="w-1/3 mr-10">
      <el-table ref="packingTableRef" :data="packingCameras" :row-key="row => row.camera_sn" height="650"
        @selection-change="handleSelectionChange">
        <el-table-column v-if="activeTab === 'time'" type="selection" width="50" />
        <el-table-column prop="camera_sn" label="整机标签列表" />
        <el-table-column prop="return_repair_date" label="返厂时间" />
      </el-table>

      <template #footer>
        <div class="mb-2 flex justify-end space-x-2">
          <el-button type="danger" plain :disabled="!canOperate" @click="handleDelete">
            删除选中 SN
          </el-button>
          <el-button type="primary" plain :disabled="!canOperate" @click="showReturnDialog = true">
            修改返厂时间
          </el-button>
        </div>
      </template>
    </el-card>

    <!-- 设置返厂时间弹窗 -->
    <el-dialog v-model="showReturnDialog" title="设置返厂时间" width="400px">
      <el-date-picker v-model="selectedReturnDate" type="datetime" placeholder="请选择返厂时间"
        value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
      <template #footer>
        <el-button @click="showReturnDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmReturnRepair">确认返厂</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import { useWarehouseStoreHook } from "@/store/modules/warehouse";
import { computed, onMounted, ref } from "vue";
import { getCameraSN, deleteCameraSN, return_repair } from "@/api/warehouse";
import { ElMessage, ElMessageBox } from "element-plus";
import { throttle } from "lodash";
import dayjs from "dayjs";

const warehouseStore = useWarehouseStoreHook();

const activeTab = ref<"sn" | "time">("time");

const dateRange = ref<[string, string]>();
const packingCode = ref("");
const cameraSNInput = ref("");

const cameraSNList = computed(() =>
  cameraSNInput.value
    .split(/[\n,，]/)
    .map((sn) => sn.trim())
    .filter((sn) => sn)
);

const packingCameras = ref<{ camera_sn: string; return_repair_date?: string }[]>([]);
const selectedSNs = ref<string[]>([]);
const selectedReturnDate = ref<string | null>(null);
const showReturnDialog = ref(false);

const canOperate = computed(() => selectedSNs.value.length > 0 || cameraSNList.value.length > 0);

const updatePackingInfos = async () => {
  const params: {
    start?: string;
    end?: string;
    packing_code?: string;
    camera_sn_list?: string[];
  } = {};

  if (activeTab.value === "time") {
    if (dateRange.value?.length === 2) {
      params.start = dateRange.value[0];
      params.end = dateRange.value[1];
    }
    if (packingCode.value.trim()) {
      params.packing_code = packingCode.value.trim();
    }
  } else if (activeTab.value === "sn") {
    if (cameraSNList.value.length) {
      params.camera_sn_list = cameraSNList.value;
    }
  }

  await warehouseStore.setPackages(params);
  await handlePreview({ packing_code: params.packing_code })
};

const throttleUpdatePackingInfos = throttle(updatePackingInfos, 800);

const handlePreview = async (row?: { packing_code: string }) => {
  const packingCode = row?.packing_code || warehouseStore.cameraSN;
  if (!packingCode) return;

  const items = row.packing_code.split(/[,\r\n\s]+/).filter(Boolean);
  const results = [];
  for (const item of items) {
    const result = await getCameraSN(item);
    results.push(...result);
  }
  const cameras = results
  // const cameras = await getCameraSN(packingCode)


  if (activeTab.value === "sn" && cameraSNList.value.length) {
    packingCameras.value = cameras.filter((item) => cameraSNList.value.includes(item.camera_sn));
  } else {
    packingCameras.value = cameras;
  }

  if (activeTab.value === "sn" && warehouseStore.cameraSN) {
    const match = cameras.find((c) => c.camera_sn === warehouseStore.cameraSN);
    selectedSNs.value = match ? [match.camera_sn] : [];
  }
};


const handleSelectionChange = (selection) => {
  selectedSNs.value = selection.map((item) => item.camera_sn);
};

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm("确认要删除选中的 SN 吗？", "提示", { type: "warning" });

    const targets = cameraSNList.value.length ? cameraSNList.value : selectedSNs.value;

    await deleteCameraSN(targets);
    ElMessage.success("删除成功");

    packingCameras.value = packingCameras.value.filter((item) => !targets.includes(item.camera_sn));
    selectedSNs.value = [];
  } catch (e) {
    if (e !== "cancel") ElMessage.error("删除失败");
  }
};

const confirmReturnRepair = async () => {
  if (!selectedReturnDate.value) {
    ElMessage.warning("请先选择返厂时间");
    return;
  }

  const targets = cameraSNList.value.length ? cameraSNList.value : selectedSNs.value;

  try {
    await return_repair(targets, selectedReturnDate.value);
    ElMessage.success("返厂成功");

    packingCameras.value = packingCameras.value.map((item) =>
      targets.includes(item.camera_sn)
        ? { ...item, return_repair_date: selectedReturnDate.value }
        : item
    );

    selectedSNs.value = [];
    selectedReturnDate.value = null;
    showReturnDialog.value = false;
  } catch (e) {
    ElMessage.error("返厂失败");
  }
};

onMounted(() => {
  // updatePackingInfos();
});
</script>
