<script setup lang="ts">
import { OrderInfo } from "@/api/order";

const props = defineProps<{ data: OrderInfo[] }>();
</script>

<template>
  <div>
    <span>工单进度</span>
    <el-table border max-height="320" :data="props.data">
      <el-table-column label="单据编号" prop="work_order_code" />
      <el-table-column label="物料编码" prop="material_code" />
      <el-table-column label="产品名称" prop="material_name" />
      <el-table-column label="生产数量" prop="produce_count" />
      <el-table-column label="已完成" prop="completed_count" />
      <el-table-column label="计划完成日期" prop="planned_endtime" />
      <el-table-column label="进度" prop="" />
      <el-table-column label="状态" prop="" />
    </el-table>
  </div>
</template>

<style lang="scss" scoped></style>
