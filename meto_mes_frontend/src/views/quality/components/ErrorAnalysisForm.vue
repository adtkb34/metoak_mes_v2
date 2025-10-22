<script setup lang="ts">
defineOptions({
  name: ""
});

const props = defineProps({
  listData: Array
});
</script>

<template>
  <div>
    <el-table :data="listData" border style="width: 100%" max-height="350">
      <el-table-column type="index" width="55" />
      <el-table-column prop="camera_sn" label="sn" />
      <el-table-column prop="error_code" label="error_code" />
      <el-table-column prop="description" label="description" />
    </el-table>
  </div>
</template>

<style lang="scss" scoped></style>
