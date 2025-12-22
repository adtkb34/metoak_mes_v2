import { computed, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { getProcessSteps, getProcessFlow } from "@/api/processFlow";
import { getAllOrders } from "@/api/order";
import { getParamsNameList } from "@/api/params";
import {
  PARAMETER_TYPE_LABELS,
  PARAMETER_TYPE_OPTIONS,
  type ParameterOption,
  type ParameterTypeOption,
  ParameterTypeEnum
} from "../types";

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

  const fetchProcessOptions = async () => {
    optionLoading.value = true;
    try {
      const steps = await getProcessSteps();
      parameterOptions.value = steps
        .map(step => ({
          label: step.stage_name ?? step.stage_code,
          value: step.step_type_no?.trim() ?? step.stage_code
        }))
        .filter(
          (item): item is ParameterOption =>
            item.value !== undefined && item.value !== null
        );
    } catch (error) {
      ElMessage.error("获取工序失败");
    } finally {
      optionLoading.value = false;
    }
  };

  const fetchFlowOptions = async () => {
    optionLoading.value = true;
    try {
      const flows = await getProcessFlow();
      parameterOptions.value = flows
        .map(flow => ({
          label: flow.process_name ?? flow.process_code,
          value: flow.flow_no ?? flow.process_code
        }))
        .filter(
          (item): item is ParameterOption =>
            item.value !== undefined && item.value !== null
        );
    } catch (error) {
      ElMessage.error("获取工艺失败");
    } finally {
      optionLoading.value = false;
    }
  };

  const fetchWorkOrderOptions = async () => {
    optionLoading.value = true;
    try {
      const orders = await getAllOrders();
      parameterOptions.value = orders
        .map(order => ({
          label: order.work_order_code ?? order.id ?? "",
          value: order.id ?? order.work_order_code ?? ""
        }))
        .filter(
          (item): item is ParameterOption =>
            item.value !== undefined && item.value !== null && item.value !== ""
        );
    } catch (error) {
      ElMessage.error("获取工单失败");
    } finally {
      optionLoading.value = false;
    }
  };

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
      ElMessage.error("获取参数集失败");
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

    if (type === ParameterTypeEnum.Process) {
      await fetchProcessOptions();
    } else if (type === ParameterTypeEnum.Craft) {
      await fetchFlowOptions();
    } else if (type === ParameterTypeEnum.WorkOrder) {
      await fetchWorkOrderOptions();
    }
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
