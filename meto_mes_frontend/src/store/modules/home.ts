import { defineStore } from "pinia";
import { store } from "..";
import { getAllOrders, type OrderInfo } from "@/api/order";
import { getHistoryInfo, getTodayInfo, type HistoryInfo } from "@/api/home";
export type TodayStageTransformed = Record<string, number>;
export type HistoryTransformed = {
  days: string;
  [stage: string]: string | undefined;
};

function pivotByDate(data: HistoryInfo[]): HistoryTransformed[] {
  const map = new Map<string, HistoryTransformed>();

  data.forEach(item => {
    if (!map.has(item.days)) {
      map.set(item.days, { days: item.days });
    }
    const record = map.get(item.days)!;
    record[item.stage] = item.num;
  });

  // 返回按照日期排序后的结果
  return Array.from(map.values()).sort((a, b) => a.days.localeCompare(b.days));
}

export const useHomeStore = defineStore("home", {
  state: (): {
    refreshTime: number;
    orderInfo: OrderInfo[];
    todayInfo: TodayStageTransformed[];
    historyInfo: HistoryTransformed[];
  } => ({
    refreshTime: 100000,
    orderInfo: [],
    todayInfo: [],
    historyInfo: []
  }),

  getters: {
    getOrderInfo: state => state.orderInfo,
    getTodayInfo: state => state.todayInfo,
    getHistoryInfo: state => state.historyInfo
  },

  actions: {
    async setOrderInfo() {
      this.orderInfo = await getAllOrders();
    },

    async setTodayInfo() {
      const todayInfo = await getTodayInfo();
      const info = {};
      todayInfo.forEach(item => {
        info[item.stage] = Number(item.num);
      });
      this.todayInfo = [info];
    },

    async setHistoryInfo() {
      const historyInfo = await getHistoryInfo();
      this.historyInfo = pivotByDate(historyInfo);
    },

    refresh(force = false) {
      this.setOrderInfo();
      this.setTodayInfo();
      this.setHistoryInfo();
    }
  }
});

export function useHomeStoreHook() {
  return useHomeStore(store);
}
