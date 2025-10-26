import { getProcessFlow, getProcessSteps } from "@/api/processFlow";
import type { ProductOrigin } from "@/enums/product-origin";
import { defineStore } from "pinia";
import { store } from "..";

export const useProcessStore = defineStore("process", {
  state: () => ({
    processStages: {
      stages: [],
      currentStage: null
    },
    processFlow: {
      list: [],
      currentFlow: null,
      origin: null as ProductOrigin | null
    },
    sortSwap: false
  }),

  getters: {
    getProcessFlowState: state => state.processFlow.list,
    getProcessStepsState: state => state.processStages.stages,

    getCurrentStage: state => state.processStages.currentStage,
    getCurrentFlow: state => state.processFlow.currentFlow
  },

  actions: {
    setSortSwap(value: boolean) {
      this.sortSwap = value;
    },

    async setProcessFlow(force = false, origin?: ProductOrigin | null) {
      const normalizedOrigin =
        typeof origin === "number" ? (origin as ProductOrigin) : null;
      const shouldRequest =
        this.processFlow.list.length === 0 ||
        force ||
        this.processFlow.origin !== normalizedOrigin;

      if (shouldRequest) {
        this.processFlow.list = await getProcessFlow(normalizedOrigin ?? undefined);
        this.processFlow.origin = normalizedOrigin;
      }
    },

    setCurrentFlow(flow_code: string) {
      this.processFlow.currentFlow = this.processFlow.list.find(
        item => item.process_code === flow_code
      );
    },

    resetCurrentFlow() {
      this.processFlow.currentFlow = {
        process_code: null,
        process_name: null,
        stage_codes: [],
      }
    },

    async setProcessSteps(force = false) {
      if (this.processStages.stages.length === 0 || force) {
        this.processStages.stages = await getProcessSteps();
      }
    },

    async unsetProcessSteps(force = false) {
      this.processStages.currentStage = {
        stage_code: null,
        stage_name: null,
        stage_desc: null,
      }
    },

    async reloadProcessSteps(force = false) {
      this.processStages.stages = await getProcessSteps();
    },

    setCurrentStage(stage_code: string) {
      
      
      this.processStages.currentStage = this.processStages.stages.find(
        item => item.stage_code === stage_code
      );
    }
  }
});

export function useProcessStoreHook() {
  return useProcessStore(store);
}
