<script setup lang="ts">
import { defineProps } from "vue";

defineProps<{
  title: string;
  data: { label: string; value: any }[] | null;
}>();
</script>

<template>
  <el-col :span="6" class="h-[20rem] mb-10">
    <span>{{ title }}</span>
    <el-table border :height="320" :data="data || []">
      <el-table-column prop="label" label="字段" />
      <el-table-column prop="value" label="值" />
    </el-table>
  </el-col>
</template>

<style scoped></style>
