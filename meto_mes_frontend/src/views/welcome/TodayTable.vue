<script setup lang="ts">
import { WorkStage } from "@/api/home";
import { TodayStageTransformed } from "@/store/modules/home";

const props = defineProps<{ data: TodayStageTransformed[] }>();
</script>

<template>
  <div>
    <span>今日生产信息</span>
    <el-table border :data="props.data">
      <el-table-column label="型号" prop="" />
      <el-table-column label="手动定焦" :prop="WorkStage.ADJUST" />
      <el-table-column label="自动定焦" :prop="WorkStage.AA" />
      <el-table-column label="组装PCBA" :prop="WorkStage.FIT_PCBA" />
      <el-table-column label="组装外壳" :prop="WorkStage.ASSEMBLE" />
      <el-table-column label="标定" :prop="WorkStage.CALIBRATION" />
      <el-table-column label="终检" :prop="WorkStage.FQC" />
      <el-table-column label="出货检" :prop="WorkStage.OQC" />
      <el-table-column label="封箱箱数" :prop="WorkStage.PACK_1" />
      <el-table-column label="封箱（相机）" :prop="WorkStage.PACK_2" />
    </el-table>
  </div>
</template>

<style lang="scss" scoped></style>
