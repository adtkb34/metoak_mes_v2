import { defineStore } from "pinia";
import { store } from "..";
import { getPackingInfo } from "@/api/warehouse";

export const useWarehouseStore = defineStore("warehouse", {
  state: () => ({
    start: "",
    end: "",
    cameraSN: "",
    camera_sn_list: [],
    packingCode: "",
    packages: [] as any[],
  }),

  getters: {},

  actions: {
    setDate(start: string, end: string) {
      this.start = start;
      this.end = end;
    },
    async setPackages(params?: { start?: string; end?: string; packing_code?: string; camera_sn_list?: string[] }) {
      if (params.packing_code) {
        const items = params.packing_code.split(/[,\r\n\s]+/).filter(Boolean);

        // 存储每个 item 的处理结果
        const results = [];

        for (const item of items) {
          // 创建一个新的 params 对象，避免覆盖原始 params
          const newParams = { ...params, packing_code: item };

          // 调用异步函数并等待结果
          const result = await getPackingInfo(newParams);

          // 将结果存储到数组中
          results.push(...result);
        }

        // // 假设你需要将结果附加到响应中
        // for (const result of results) {
        //   // 假设 result 是一个对象，包含 key 和 value
        //   for (const [key, value] of Object.entries(result)) {
        //     res.push(key, value);
        //   }
        // }
        this.packages = results
        // this.packages = await Promise.all(
        //   params.packing_code
        //     .split(/[,\r\n\s]+/)
        //     .filter(Boolean)
        //     .map(item => {
        //       params.packing_code = item
        //       console.log(params)
        //       getPackingInfo(params || {})

        //       console.log(getPackingInfo(params || {}))
        //     })
        // );

      } else {
        this.packages = await getPackingInfo(params || {});
      }
    }
  }
});

export function useWarehouseStoreHook() {
  return useWarehouseStore(store);
}
