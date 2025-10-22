// store/modules/SPC/v1.ts
import { defineStore } from 'pinia';
import { reactive } from 'vue';

export const useSpcStore = defineStore('SPC v1', () => {
  const state = reactive({
    selectedLength: 150,
    childLength: 2,
    isRealtime: true,
    selectedRules: [] as string[],
    showControlLines: true,
    dateRange: null as [Date, Date] | null,
    spuId: 'S315' as string | number | null,
    taskId: null as string | number | null,
    stepId: null as string | number | null,
    attrId: null as string | number | null,
    usl: 0,
    lsl: 0,
    data: [0],
    selectedField: '', // 字段选择
    selectedTitle: ''
  });

  const setData = (arr: number[]) => {
    state.data = arr;
  };

  const setDateRange = (val: [Date, Date] | null) => {
    state.dateRange = val;
  };

  const fetchAndUpdate = async () => {
    if (!state.selectedField || !state.dateRange) return;
    try {
      const params = new URLSearchParams({
        field: state.selectedField,
        start: state.dateRange[0].toISOString(),
        end: state.dateRange[1].toISOString(),
        limit: String(state.selectedLength),
      });

      // 规则
      const BASE_URL = `${import.meta.env.VITE_SPC_URL}`;
      const res = await fetch(`${BASE_URL}/spc/series?${params}`);
      let result = await res.json();
      result = result.map(item => item.value)
      setData(result);

      // 控制线
      // const linesRes = await fetch(`${BASE_URL}/spc/limits?${params}`);
      // const lines = await linesRes.json()
      // state.usl = lines.usl;
      // state.lsl = lines.lsl;
    } catch (e) {
      console.error('fetch failed:', e);
    }
  };

  return {
    state,
    setData,
    setDateRange,
    fetchAndUpdate,
  };
});