<script setup lang="ts">
import management from "./management.vue";
import query from "./query.vue";

defineOptions({
  name: ""
});
</script>

<template>
  <el-tabs class="h-full">
    <el-tab-pane label="标签管理">
      <management />
    </el-tab-pane>
    <el-tab-pane label="标签查询">
      <query />
    </el-tab-pane>
  </el-tabs>
</template>

<style lang="scss" scoped></style>
