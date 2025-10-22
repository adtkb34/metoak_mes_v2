// views/SPC/utils/composable.ts
import { useSpcStore } from '@/store/modules/SPC/v1';
import { useSpcStorev2 } from '@/store/modules/SPC/v2';
import { onMounted, onUnmounted, ref, watch } from 'vue';

export function useSpcRealtimeFetch() {
  const spc = useSpcStorev2();
  const intervalId = ref<number | null>(null);

  const start = async () => {
    if (!spc.isRealtime) return;
    console.log("spc start");
    
    await spc.fetchData();
    intervalId.value = window.setInterval(spc.fetchData, 5000);
  };

  const stop = () => {
    if (intervalId.value) clearInterval(intervalId.value);
  };

  onMounted(start);
  onUnmounted(stop);

  watch(() => spc.isRealtime, (val) => {
    stop();
    if (val) start();
  });
}