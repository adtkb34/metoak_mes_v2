import { onMounted, ref } from "vue";
import { fetchPackingWeightRules } from "../services/packingWeightRule.api";
import { notifyLoadFailure } from "../services/packingWeightRule.service";
import type { PackingWeightRule } from "../types";

export const usePackingWeightRules = () => {
  const loading = ref(false);
  const rules = ref<PackingWeightRule[]>([]);

  const loadRules = async () => {
    loading.value = true;
    try {
      rules.value = await fetchPackingWeightRules();
    } catch (error) {
      notifyLoadFailure(error);
    } finally {
      loading.value = false;
    }
  };

  onMounted(loadRules);

  return {
    rules,
    loading,
    loadRules
  };
};
