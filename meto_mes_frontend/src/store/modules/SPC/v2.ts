import { getSpcSteps, getSpcAttrs, getSpcValues } from "@/api/spc";
import { defineStore } from "pinia";
import { ref } from "vue";


export const useSpcStorev2 = defineStore("spc-v2", () => {
  // 状态
  const stepList = ref<{ key: string; label: string }[]>([]);
  const attrList = ref<{ key: string; label: string }[]>([]);
  const selectedStep = ref<string>("");
  const selectedField = ref<string>("");
  const selectedTitle = ref<string>("");

  const dateRange = ref<[Date, Date] | null>(null);
  const selectedLength = ref<number>(150);
  const childLength = ref<number>(2);
  const isRealtime = ref<boolean>(true);
  const selectedRules = ref<string[]>([]);
  const showControlLines = ref<boolean>(true);

  const data = ref<number[]>([0]);
  const usl = ref<number>(0);
  const lsl = ref<number>(0);
  const station = ref<number>(0);
  const position = ref<number>(0);

  // 异步加载 Step 列表
  async function fetchSteps() {
    stepList.value = await getSpcSteps();
  }

  // 异步加载 Attr 列表
  async function fetchAttrs(stepNo: string) {
    selectedStep.value = stepNo;
    attrList.value = await getSpcAttrs(stepNo);
  }

  // 获取数据 + 控制线
  async function fetchData() {
    if (!selectedStep.value || !selectedField.value) return;

    try {
      let res;
      if (dateRange.value) {
        res = await getSpcValues(
          selectedStep.value,
          selectedField.value,
          selectedLength.value,
          dateRange.value[0].toISOString(),
          dateRange.value[1].toISOString()
        );
      } else {
        res = await getSpcValues(
          selectedStep.value,
          selectedField.value,
          selectedLength.value
        );

      }



      // 当前 getSpcValues 返回的是 number[]
      data.value = res;
    } catch (e) {
      console.error("获取 SPC 数据失败", e);
    }
  }

  return {
    stepList,
    attrList,
    selectedStep,
    selectedField,
    selectedTitle,
    dateRange,
    selectedLength,
    childLength,
    isRealtime,
    selectedRules,
    showControlLines,
    data,
    usl,
    lsl,
    station,
    position,

    fetchSteps,
    fetchAttrs,
    fetchData
  };
});
