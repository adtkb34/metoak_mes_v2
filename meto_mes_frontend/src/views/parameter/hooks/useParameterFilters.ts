import { computed, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { getParamsNameList } from "@/api/params";
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
  parameterNameOptions: ReturnType<typeof ref<ParameterOption[]>>;
  optionLabel: ReturnType<typeof computed<string>>;
  optionPlaceholder: ReturnType<typeof computed<string>>;
  relationLabel: ReturnType<typeof computed<string>>;
  isProjectType: ReturnType<typeof computed<boolean>>;
  optionLoading: ReturnType<typeof ref<boolean>>;
  nameLoading: ReturnType<typeof ref<boolean>>;
  refreshOptions: (type: ParameterTypeEnum) => Promise<void>;
  fetchParameterNames: () => Promise<void>;
}

export function useParameterFilters(): ParameterFilterContext {
  const { loadOptions } = useParameterOptionsLoader();
  const parameterTypes = PARAMETER_TYPE_OPTIONS;
  const selectedType = ref<ParameterTypeEnum>(ParameterTypeEnum.Process);
  const selectedOption = ref<string | number | null>(null);
  const parameterOptions = ref<ParameterOption[]>([]);
  const parameterNameOptions = ref<ParameterOption[]>([]);
  const optionLoading = ref(false);
  const nameLoading = ref(false);

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

  const fetchParameterNames = async () => {
    if (!isProjectType.value && selectedOption.value === null) {
      parameterNameOptions.value = [];
      return;
    }
    nameLoading.value = true;
    try {
      const paramsList = await getParamsNameList({
        type: selectedType.value,
        relationId: selectedOption.value
      });
      parameterNameOptions.value = paramsList
        .map(item => ({
          label: item.name ?? `参数集 ${item.id ?? ""}`,
          value: item.id ?? item.name ?? ""
        }))
        .filter(
          (item): item is ParameterOption =>
            item.value !== undefined && item.value !== null && item.value !== ""
        );
    } catch (error) {
      ElMessage.error((error as Error)?.message ?? "获取参数集失败");
    } finally {
      nameLoading.value = false;
    }
  };

  const refreshOptions = async (type: ParameterTypeEnum) => {
    selectedOption.value = null;
    parameterOptions.value = [];
    parameterNameOptions.value = [];

    if (type === ParameterTypeEnum.Project) {
      await fetchParameterNames();
      return;
    }

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

  watch(
    () => selectedOption.value,
    value => {
      if (!isProjectType.value && value === null) {
        parameterNameOptions.value = [];
        return;
      }
      fetchParameterNames();
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
    parameterNameOptions,
    optionLabel,
    optionPlaceholder,
    relationLabel,
    isProjectType,
    optionLoading,
    nameLoading,
    refreshOptions,
    fetchParameterNames
  };
}
