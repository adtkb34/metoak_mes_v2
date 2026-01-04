import { onMounted, ref } from "vue";
import { fetchWorkOrderMaterials } from "../services/packingWeightRuleMaterial.api";
import {
  buildProductOptions,
  notifyMaterialLoadFailure
} from "../services/packingWeightRuleMaterial.service";
import type { ProductOption } from "../types";

export const useWorkOrderMaterialOptions = () => {
  const loading = ref(false);
  const options = ref<ProductOption[]>([]);

  const loadOptions = async () => {
    loading.value = true;
    try {
      const materials = await fetchWorkOrderMaterials();
      options.value = buildProductOptions(materials);
    } catch (error: Error | string | number | boolean | null | undefined) {
      notifyMaterialLoadFailure(error);
    } finally {
      loading.value = false;
    }
  };

  onMounted(loadOptions);

  return {
    loading,
    options,
    loadOptions
  };
};
