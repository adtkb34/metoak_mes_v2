import { computed, onMounted, ref, watch } from "vue";
import {
  PARAMETER_TYPE_LABELS,
  PARAMETER_TYPE_OPTIONS,
  type ParameterOption,
  type ParameterTypeOption,
  ParameterTypeEnum
} from "../types";
import { useParameterOptionsLoader } from "./useParameterOptionsLoader";

export interface ParameterFilterContext {
  parameterTypes: ParameterTypeOption[];
  selectedType: ReturnType<typeof ref<ParameterTypeEnum>>;
  selectedOption: ReturnType<typeof ref<string | number | null>>;
  parameterOptions: ReturnType<typeof ref<ParameterOption[]>>;
  optionLabel: ReturnType<typeof computed<string>>;
  optionPlaceholder: ReturnType<typeof computed<string>>;
  relationLabel: ReturnType<typeof computed<string>>;
  isProjectType: ReturnType<typeof computed<boolean>>;
  optionLoading: ReturnType<typeof ref<boolean>>;
  refreshOptions: (type: ParameterTypeEnum) => Promise<void>;
}

export function useParameterFilters(): ParameterFilterContext {
  const { loadOptions } = useParameterOptionsLoader();
  const parameterTypes = PARAMETER_TYPE_OPTIONS;
  const selectedType = ref<ParameterTypeEnum>(ParameterTypeEnum.Step);
  const selectedOption = ref<string | number | null>(null);
  const parameterOptions = ref<ParameterOption[]>([]);
  const optionLoading = ref(false);

  const optionLabel = computed(
    () => PARAMETER_TYPE_LABELS[selectedType.value] ?? "关联项"
  );
  const optionPlaceholder = computed(() => `请选择${optionLabel.value}`);
  const isProjectType = computed(
    () => selectedType.value === ParameterTypeEnum.Project
  );
  const relationLabel = computed(
    () =>
      parameterOptions.value.find(item => item.value === selectedOption.value)
        ?.label ?? optionLabel.value
  );

  const refreshOptions = async (type: ParameterTypeEnum) => {
    selectedOption.value = null;
    parameterOptions.value = [];

    if (type === ParameterTypeEnum.Project) return;

    optionLoading.value = true;
    const options = await loadOptions(type);
    parameterOptions.value = options;
    optionLoading.value = false;
  };

  watch(
    () => selectedType.value,
    value => {
      refreshOptions(value);
    }
  );

  onMounted(async () => {
    await refreshOptions(selectedType.value);
  });

  return {
    parameterTypes,
    selectedType,
    selectedOption,
    parameterOptions,
    optionLabel,
    optionPlaceholder,
    relationLabel,
    isProjectType,
    optionLoading,
    refreshOptions
  };
}
