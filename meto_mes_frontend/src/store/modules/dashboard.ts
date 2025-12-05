import dayjs from "dayjs";
import { defineStore } from "pinia";

import type { FilterState } from "@/views/dashboard/types";
import { ProductOrigin } from "@/enums/product-origin";
import { store } from "..";

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "";

export const getDefaultDateRange = (): string[] => {
  const today = dayjs().format("YYYY-MM-DD");
  return [today, today];
};

export const getDefaultOrigin = (): ProductOrigin =>
  backendUrl.includes("11.11.11.15")
    ? ProductOrigin.Suzhou
    : ProductOrigin.Mianyang;

export const useDashboardStore = defineStore("dashboard", {
  state: () => ({
    filters: {
      dateRange: getDefaultDateRange(),
      product: [] as string[],
      origin: getDefaultOrigin(),
      processCode: null
    } as FilterState
  }),
  actions: {
    resetFilters() {
      this.filters.dateRange = getDefaultDateRange();
      this.filters.product = [];
      this.filters.origin = getDefaultOrigin();
      this.filters.processCode = null;
    }
  }
});

export function useDashboardStoreHook() {
  return useDashboardStore(store);
}
