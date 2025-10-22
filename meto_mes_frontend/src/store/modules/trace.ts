import { defineStore } from "pinia";
import { store } from "..";
import { getSnTraceInfo, getSnTraceInfoV2 } from "@/api/trace";
import { formatToUTC8 } from "@/utils/date";

type LabelValue = { label: string; value: any };

const formatValue = (key: string, value: any) => {
  if (key.includes("time") && value) {
    return formatToUTC8(value);
  }
  return value ?? "";
};

const buildInfo = (source: any, fields: [string, string][]): LabelValue[] =>

  fields.map(([label, key]) => ({
    label,
    value: formatValue(key, source?.[key])
  }));

function moveFieldsToFront(obj, keys) {
  // 复制原对象
  const rest = { ...obj };
  const front = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      front[key] = obj[key];
      delete rest[key]; // 移除剩余的
    }
  }
  return { ...front, ...rest };
}

export const useTraceStore = defineStore("trace", {
  state: () => ({
    sn: "",
    flowCode: null,
    info: null as any,
    version: 'v2'
  }),

  getters: {
    getInfo: state => state.info,

    getAdjust: state =>
      buildInfo(state.info?.adjustInfo, [
        ["工位号", "station_number"],
        ["操作人员", "operator"],
        ["操作时间", "start_time"],
        ["结果码", "check_result"],
        ["判定结果", "invalid"]
      ]),

    getFQC: state =>
      buildInfo(state.info?.FQCInfo, [
        ["工位号", "station_number"],
        ["操作人员", "operator"],
        ["操作时间", "start_time"],
        ["结果码", "check_result"],
        ["图片路径", "image_path"]
      ]),
    getOQC: state =>
      buildInfo(state.info?.OQCInfo, [
        ["工位号", "station_number"],
        ["操作人员", "operator"],
        ["操作时间", "start_time"],
        ["结果码", "check_result"],
        ["图片路径", "image_path"]
      ]),

    getCalibrationInfo: state =>
      buildInfo(state.info?.calibrationInfo, [
        ["工位号", "station_number"],
        ["操作人员", "operator"],
        ["操作时间", "start_time"],
        ["EPR文件名", "epr_filename"],
        ["yml文件名", "yml_filename"],
        ["判定结果", "check_result"],
        ["结果码", "error_code"],
        ["工具版本", "tool_version"]
      ]),

    getAssemble1: state =>
      buildInfo(state.info?.assembleInfo, [
        ["工位号", "station_number"],
        ["操作人员", "operator"],
        ["操作时间", "start_time"],
        ["结果码", "check_result"],
        ["PCBA CODE", "pacba_code"]
      ]),
    getPackingInfo: state =>
      buildInfo(state.info?.packingInfo, [
        ["工位号", "station_number"],
        ["操作人员", "operator"],
        ["操作时间", "start_time"],
        ["箱号", "packing_code"],
        ["工具版本 CODE", "tool_version"]
      ])
  },

  actions: {
    setSN(sn: string) {
      this.sn = sn;
    },

    setFlowCode(flowCode: string) {
      this.flowCode = flowCode;
    },

    async setInfo() {
      switch (this.version) {
        case 'v1':
          this.info = await getSnTraceInfo(this.sn);
          break;
        case 'v2':
          this.info = await getSnTraceInfoV2(this.sn, this.flowCode);
          break;
      }
      console.log(this.info);

    },
  }
});

export function useTraceStoreHook() {
  return useTraceStore(store);
}
