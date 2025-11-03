// src/store/modules/SPC/v2.ts
import { defineStore } from "pinia";
import { ref, watch, onUnmounted } from "vue";
import { getSpcSteps, getSpcAttrs, getSpcValues } from "@/api/spc";
import { STEP_NO } from "@/enums/step-no";

export const createSpcStore = (id?: string) => {
  return defineStore(`spc-v2-${id ?? crypto.randomUUID()}`, () => {
    // ----------- 状态 -----------
    const stepList = ref<{ key: string; label: string }[]>([]);
    const attrList = ref<{ key: string; label: string }[]>([]);
    const selectedStep = ref("002");
    const selectedField = ref("");
    const selectedTitle = ref("");
    const selectedPosition = ref("1");
    const selectedStation = ref(undefined);
    const origin = ref("1");
    const stage = ref("1");

    const dateRange = ref<[Date, Date] | null>(null);
    const selectedLength = ref(30);
    const childLength = ref(2);
    const isRealtime = ref(true);
    const selectedRules = ref<string[]>([]);
    const showControlLines = ref(true);

    const data = ref<number[]>([]);
    const ng = ref<number[]>([]);
    const usl = ref(0);
    const lsl = ref(0);

    // 定时器句柄
    let timer: number | null = null;

    // ----------- API ----------
    async function fetchSteps(filter_spc_field: boolean = true) {
      if (filter_spc_field) {
        stepList.value = [{
          key: STEP_NO.AUTO_ADJUST,
          label: '自动调焦',
        },
        {
          key: STEP_NO.CALIB,
          label: '标定',
        }];
      } else {
        stepList.value = await getSpcSteps();
      }
    }

    async function fetchAttrs(stepNo: string) {
      selectedStep.value = stepNo;
      attrList.value = await getSpcAttrs(stepNo);
    }

    async function fetchData() {
      if (!selectedStep.value || !selectedField.value) return;

      const fetchSpcData = async (params?: {
        attrKeys?: string;
        origin?: number;
        device?: number | undefined;
        count?: number;
        position?: number;
        stage?: number;
        stepNo?: string;
      }) => {
        const baseUrl = `${import.meta.env.VITE_SPC_URL}/api/mes/v1/production-record-query/spc`;
        const query = new URLSearchParams({
          attrKeys: params?.attrKeys ?? 'mtf_center_value',
          origin: String(params?.origin ?? 1),
          device: String(params?.device ?? 1),
          count: String(params?.count ?? 50),
          position: String(params?.position ?? 1),
          stage: String(params?.stage ?? 1),
          stepTypeNo: String(params?.stepNo ?? '000'),
        });
        const url = `${baseUrl}?${query.toString()}`;
        const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        return json;
      };

      try {
        if (selectedStep.value === STEP_NO.AUTO_ADJUST || selectedStep.value === STEP_NO.CALIB) {
          const requestBody = {
            attrKeys: selectedField.value,
            origin: +origin.value,
            device: +selectedStation.value,
            count: selectedLength.value,
            position: +selectedPosition.value,
            stage: +stage.value,
            stepNo: selectedStep.value,
          }
          if (selectedStep.value === STEP_NO.CALIB) {
            const result = await fetchSpcData({
              attrKeys: selectedField.value,
              origin: +origin.value,
              device: undefined,
              count: selectedLength.value,
              position: +selectedPosition.value,
              stage: +stage.value,
              stepNo: selectedStep.value,
            });
            data.value = result.data.OK.map((v: string) => +v);
            ng.value = result.data.NG.map((v: string) => +v);
          } else {
            const result = await fetchSpcData(requestBody);
            data.value = result.data.OK.map((v: string) => +v);
            ng.value = result.data.NG.map((v: string) => +v);
          }
        } else {
          const res = await getSpcValues(
            selectedStep.value,
            selectedField.value,
            selectedLength.value,
            selectedPosition.value,
            selectedStation.value,
          );
          data.value = res;
        }
      } catch (err) {
        console.error(`SPC(${id}) 获取数据失败:`, err);
      }
    }

    // ----------- 实时轮询控制 -----------
    function startRealtime(interval = 5000) {
      stopRealtime(); // 确保不重复启动
      timer = window.setInterval(fetchData, interval);
      console.log(`[SPC-${id}] 实时模式已启动 (${interval}ms)`);
    }

    function stopRealtime() {
      if (timer) {
        clearInterval(timer);
        timer = null;
        console.log(`[SPC-${id}] 实时模式已停止`);
      }
    }

    // 自动监听 isRealtime 变化
    watch(isRealtime, (val) => {
      if (val) startRealtime();
      else stopRealtime();
    }, { immediate: true });

    // 组件销毁时清理
    onUnmounted(stopRealtime);

    return {
      // state
      stepList,
      attrList,
      selectedStep,
      selectedField,
      selectedTitle,
      selectedPosition,
      selectedStation,
      origin,
      stage,
      dateRange,
      selectedLength,
      childLength,
      isRealtime,
      selectedRules,
      showControlLines,
      data,
      ng,
      usl,
      lsl,
      // actions
      fetchSteps,
      fetchAttrs,
      fetchData,
      startRealtime,
      stopRealtime,
    };
  });
};

export const useSpcStore = (id?: string) => createSpcStore(id ?? crypto.randomUUID())();
