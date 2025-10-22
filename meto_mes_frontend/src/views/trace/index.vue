<script setup lang="ts">
import { useTraceStoreHook } from "@/store/modules/trace";
import { message } from "@/utils/message";
import { onMounted, ref } from "vue";
import TraceTable from "./TraceTable.vue";
import { useProcessStore } from "@/store/modules/processFlow";

const processStore = useProcessStore();
defineOptions({ name: "Trace" });

const traceStore = useTraceStoreHook();
const sn = ref("");
const flowCode = ref("");

const handleClick = async () => {
  if (!sn.value) {
    message("sn 不能为空", { type: "error" });
    return;
  }
  traceStore.setSN(sn.value);
  traceStore.setFlowCode(flowCode.value);
  await traceStore.setInfo();

};

onMounted(() => {
  sn.value = traceStore.sn;
  processStore.setProcessFlow();
});
</script>

<template>
  <el-card>
    <el-row :gutter="10" class="mb-3">
      <el-col :span="8">
        <span>产品追溯</span>
      </el-col>
    </el-row>

    <el-row :gutter="10" class="mb-5">
      <el-col :span="8">
        <el-input v-model="sn" placeholder="请输入标签序列号" />
      </el-col>
      <el-col :span="8">
        <el-select v-model="flowCode" placeholder="请选择工艺" filterable>
          <el-option v-for="item in processStore.processFlow.list" :key="item.process_code"
            :label="`${item.process_code} (${item.process_name})`" :value="item.process_code" />
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-button @click="handleClick">查询</el-button>
      </el-col>
    </el-row>

    <el-row :gutter="10" class="mb-10" v-if="traceStore.version === 'v2' && traceStore.info?.data">
      <template v-for="item in traceStore.info.data">
        <TraceTable :title="item.step" :data="item.data" />
      </template>
    </el-row>

    <el-row :gutter="10" class="mb-10" v-if="traceStore.version === 'v1'">
      <TraceTable title="定焦信息" :data="traceStore.getAdjust" />
      <TraceTable title="组装信息1" :data="traceStore.getAssemble1" />
      <TraceTable title="标定信息" :data="traceStore.getCalibrationInfo" />
    </el-row>

    <el-row :gutter="10" class="mb-5" v-if="traceStore.version === 'v1'">
      <TraceTable title="终检信息" :data="traceStore.getFQC" />
      <TraceTable title="出货检信息" :data="traceStore.getOQC" />
      <TraceTable title="封箱信息" :data="traceStore.getPackingInfo" />
    </el-row>
  </el-card>
</template>

<style lang="scss" scoped></style>
