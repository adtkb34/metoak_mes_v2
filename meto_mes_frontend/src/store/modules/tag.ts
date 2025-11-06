import { getBeamSN, getTagOrders } from "@/api/tag";
import { spliceFields } from "@/views/tag/utils";
import { defineStore } from "pinia";
import type { BeamSerialItem, LabelType, ShellSerialItem, TagListResponse } from "types/tag";

export const useTagStore = defineStore("tag", {
  state: () => ({
    order: {
      isLoaded: false,
      list: [],
      current: null
    },
    beamSN: {
      produceOrderID: "",
      list: null as TagListResponse<BeamSerialItem | ShellSerialItem> | null,
      labelType: "beam" as LabelType
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
    getBeamSN: state => state.beamSN.list?.data ?? [],
    getBeamListLength: state => state.beamSN.list?.length ?? 0,
    getMaterialCode: state => state.materialCode.list,
    getCurrentLabelType: state => state.beamSN.labelType,
    getSerialField: state => (state.beamSN.labelType === "shell" ? "tag_sn" : "beam_sn")
  },

  actions: {
    setCurrentOrder(orderCode: string) {
      this.order.current = this.order.list.find(
        order => spliceFields(order) === orderCode
      );
    },

    async setOrderList() {
      if (!this.order.isLoaded) {
        this.order.list = await getTagOrders();
        this.order.isLoaded = true;
      }
    },

    async setSNList(orderCode: string, labelType: LabelType = "beam") {
      // const { id } = this.order.list.find(
      //   order => spliceFields(order) === splicedCode
      // );
      // this.beamSN.produceOrderID = id;
      this.beamSN.list = await getBeamSN(orderCode, labelType);
      this.beamSN.labelType = labelType;
    },

    async setMaterialCode() {
      if (!this.materialCode.isLoaded) {
        // this.materialCode.list = await getBeamMaterialCode();
        this.materialCode.isLoaded = true;
      }
    }
  }
});
