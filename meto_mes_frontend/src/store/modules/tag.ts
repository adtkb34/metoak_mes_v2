import { getAllOrders } from "@/api/order";
import { getBeamSN } from "@/api/tag";
import { spliceFields } from "@/views/tag/utils";
import { defineStore } from "pinia";

export const useTagStore = defineStore("tag", {
  state: () => ({
    order: {
      isLoaded: false,
      list: [],
      current: null
    },
    beamSN: {
      produceOrderID: "",
      list: null
    },
    materialCode: {
      isLoaded: false,
      list: []
    }
  }),

  getters: {
    getOrderList: state => state.order.list,
    getOrder: state => state.order.current,
    getOrderCode: state => state.order.current?.work_order_code ?? "",
    getProduceID: state => state.order.current?.id ?? "",
    getBeamSN: state => {
      if (!state.beamSN.list) {
        return [];
      }
      return state.beamSN.list.data;
    },
    getBeamListLength: state => state.beamSN.list?.length ?? 0,
    getMaterialCode: state => state.materialCode.list
  },

  actions: {
    setCurrentOrder(orderCode: string) {
      this.order.current = this.order.list.find(
        order => spliceFields(order) === orderCode
      );
    },

    async setOrderList() {
      if (!this.isOrderListLoaded) {
        this.order.list = await getAllOrders();
        this.order.isLoaded = true;
      }
    },

    async setSNList(orderCode: string) {
      // const { id } = this.order.list.find(
      //   order => spliceFields(order) === splicedCode
      // );
      // this.beamSN.produceOrderID = id;
      this.beamSN.list = await getBeamSN(orderCode);
    },

    async setMaterialCode() {
      if (!this.materialCode.isLoaded) {
        // this.materialCode.list = await getBeamMaterialCode();
        this.materialCode.isLoaded = true;
      }
    }
  }
});
