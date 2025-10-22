<script setup lang="ts">
import { useHomeStoreHook } from "@/store/modules/home";
import OrderTable from "./OrderTable.vue";
import TodayTable from "./TodayTable.vue";
import HistoryTable from "./HistoryTable.vue";
import { onMounted, onUnmounted, ref } from "vue";
import ProductInfo from "./ProductInfo.vue";
      
defineOptions({
  name: "Welcome"
});

const homeStore = useHomeStoreHook();
const intervalId = ref<ReturnType<typeof setInterval> | null>(null);

// 轮询刷新
const startTimer = () => {
  stopTimer(); // 避免重复设置
  homeStore.refresh(); // 立即请求一次
  intervalId.value = setInterval(() => {
    homeStore.refresh();
  }, homeStore.refreshTime);
};

// 停止轮询
const stopTimer = () => {
  if (intervalId.value !== null) {
    clearInterval(intervalId.value);
    intervalId.value = null;
  }
};

// 页面可见性变化回调
const handleVisibilityChange = () => {
  if (document.visibilityState === "visible") {
    startTimer(); // 页面可见，恢复轮询
  } else {
    stopTimer(); // 页面隐藏，暂停轮询
  }
};

onMounted(() => {
  document.addEventListener("visibilitychange", handleVisibilityChange);

  if (document.visibilityState === "visible") {
    startTimer();
  }
});

onUnmounted(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  stopTimer();
});
</script>


<template>
  <el-card>
    <div class="mb-3">
      <ProductInfo></ProductInfo>
    </div>
    <div class="mb-3">
      <TodayTable :data="homeStore.getTodayInfo" />
    </div>
    <div class="mb-3">
      <OrderTable :data="homeStore.getOrderInfo" />
    </div>
    <div>
      <HistoryTable :data="homeStore.getHistoryInfo" />
    </div>
  </el-card>
</template>
