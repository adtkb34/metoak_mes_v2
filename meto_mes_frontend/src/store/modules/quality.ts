import { getQualityData } from "@/api/quality";
import { type DateRangeRef, isDateEmpty, useDateToString } from "@/utils/date";
import { defineStore } from "pinia";

export const useQualityStore = defineStore("quality", {
  state: () => ({
    qualityAnalysisData: null,
    errorAnalysisData: null
  }),

  getters: {
    getQualityAnalysisData: state => state.qualityAnalysisData
  },

  actions: {
    async setQualityAnalysis(dateRange: DateRangeRef) {
      if (isDateEmpty(dateRange)) return;

      const [start, end] = useDateToString(dateRange);
      const qualityData = await getQualityData(start, end);

      this.qualityAnalysisData = [];

      Object.keys(qualityData).forEach(key => {
        const { total, onePass, qualified } = qualityData[key];
        const defects = total - qualified;

        this.qualityAnalysisData.push({
          passRate: total === 0 ? 0 : onePass / total,
          qualificationRate: total === 0 ? 0 : qualified / total,
          defects,
          total
        });
      });
    },

    setLoaded() {
      this.isLoaded = !this.isLoaded;
    }
  }
});
