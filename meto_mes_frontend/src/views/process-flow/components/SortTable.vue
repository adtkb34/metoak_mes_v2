<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import Sortable, { Swap } from "sortablejs";
import { useProcessStoreHook } from "@/store/modules/processFlow";

defineOptions({
  name: "Draggable"
});

const cutList = defineModel<string[]>("cutList");

const processStore = useProcessStoreHook();

watch(
  () => cutList,
  () => { }
);

const stageCode = ref();
const handleAdd = () => {
  if (stageCode.value) {
    cutList.value.push(stageCode.value);
  }
};

onMounted(() => {
  processStore.setProcessSteps();

  if (!processStore.sortSwap) Sortable.mount(new Swap());
  processStore.setSortSwap(true);

  new Sortable(document.querySelector(".cut-container"), {
    swap: true,
    forceFallback: true,
    chosenClass: "chosen",
    swapClass: "highlight",
    animation: 300,

    onEnd: (evt) => {
      if (evt.oldIndex != null && evt.newIndex != null) {
        const movedItem = cutList.value.splice(evt.oldIndex, 1)[0];
        cutList.value.splice(evt.newIndex, 0, movedItem);
      }
    }
  });
});
</script>

<template>
  <div class="drag-container">
    <!-- grid列表拖拽 -->
    <el-row :gutter="25">
      <el-col :xs="25" :sm="8" :md="8" :lg="8">
        <el-card shadow="never">
          <div class="cut-container">
            <div v-for="(item, index) in cutList" :key="index" class="item-cut">
              <p>{{ item }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-card shadow="never" class="w-1/3">
        <el-select v-model="stageCode" class="w-10 mb-5">
          <el-option v-for="item in processStore.getProcessStepsState" :key="item.stage_code"
            :label="`${item.stage_code} - ${item.stage_name}`" :value="item.stage_name" />
        </el-select>
        <el-button @click="handleAdd">添加</el-button>
        <el-button @click="() => cutList.pop()">删除</el-button>
      </el-card>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
/* grid列表拖拽 */
.grid-container {
  display: grid;
  grid-template-rows: 33.3% 33.3% 33.3%;
  grid-template-columns: 33.3% 33.3% 33.3%;
}

.item-single {
  height: 77px;
  font-size: 1.5em;
  line-height: 85px;
  text-align: center;
  cursor: move;
  border: 1px solid #e5e4e9;
}

.item-cut {
  height: 35px;
  font-size: 1.5em;
  line-height: 35px;
  text-align: center;
  cursor: move;
  border: 1px solid #e5e4e9;
}

.item {
  font-size: 2em;
  line-height: 100px;
  text-align: center;
  cursor: move;
  border: 1px solid #e5e4e9;

  @media screen and (width <=750px) {
    line-height: 90px;
  }
}

.chosen {
  border: solid 2px #3089dc !important;
}
</style>
