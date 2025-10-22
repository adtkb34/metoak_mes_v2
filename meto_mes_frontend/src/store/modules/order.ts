import { getAllOrders } from "@/api/order";
import { defineStore } from "pinia";
import { store } from "..";

export const useOrderStore = defineStore("order", {
  state: () => ({
    isOpen: false,
    order: {
      list: [],
      current: null
    }
  }),

  getters: {
    getOrderList: state => state.order.list,
    getCurrentOrder: state => state.order.current
  },

  actions: {
    async setOrderList() {
      if (this.order.list.length === 0) {
        this.order.list = await getAllOrders();
        this.isLoaded = true;
      }
    },

    async reloadOrderList() {
      // if (this.order.list.length === 0) {
      this.order.list = await getAllOrders();
      this.isLoaded = true;
      // }
    },

    async setCurrentOrder(id: number) {
      const currentOrder = await this.order.list.find(item => item.id === id);
      this.order.current = currentOrder;
    }
  }
});

export function useOrderStoreHook() {
  return useOrderStore(store);
}
