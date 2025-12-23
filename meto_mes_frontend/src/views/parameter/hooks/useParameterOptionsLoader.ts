import { ElMessage } from "element-plus";
import { getAllOrders } from "@/api/order";
import { getProcessSteps, getProcessFlow } from "@/api/processFlow";
import { getParameterBaseByType } from "../services/parameter.api";
import { ParameterTypeEnum, type ParameterOption } from "../types";

export enum ParameterOptionErrorMessage {
  Process = "获取工序失败",
  Craft = "获取工艺失败",
  WorkOrder = "获取工单失败",
  Project = "获取工程失败"
}

const normalizeOptions = (
  options: Array<{ label?: string; value?: string | number | null }>
): ParameterOption[] =>
  options.filter(
    (item): item is ParameterOption =>
      item.value !== undefined &&
      item.value !== null &&
      item.value !== "" &&
      item.label !== undefined &&
      item.label !== null &&
      item.label !== ""
  );

const buildProcessOptions = async (): Promise<ParameterOption[]> => {
  try {
    const steps = await getProcessSteps();
    const mappedOptions = steps.map(step => {
      const stepTypeNo = step.step_type_no?.trim() ?? "";
      return {
        label: step.stage_name ?? step.step_type_no ?? step.stage_code ?? "",
        value: stepTypeNo
      };
    });
    return normalizeOptions(mappedOptions);
  } catch (error) {
    ElMessage.error(
      (error as Error)?.message ?? ParameterOptionErrorMessage.Process
    );
    return [];
  }
};

const buildCraftOptions = async (): Promise<ParameterOption[]> => {
  try {
    const flows = await getProcessFlow();
    const mappedOptions = flows.map(flow => ({
      label: flow.process_name ?? flow.process_code ?? "",
      value: flow.flow_no ?? flow.process_code ?? ""
    }));
    return normalizeOptions(mappedOptions);
  } catch (error) {
    ElMessage.error(
      (error as Error)?.message ?? ParameterOptionErrorMessage.Craft
    );
    return [];
  }
};

const buildWorkOrderOptions = async (): Promise<ParameterOption[]> => {
  try {
    const orders = await getAllOrders();
    const mappedOptions = orders.map(order => ({
      label: order.work_order_code ?? order.id ?? "",
      value: order.id ?? order.work_order_code ?? ""
    }));
    return normalizeOptions(mappedOptions);
  } catch (error) {
    ElMessage.error(
      (error as Error)?.message ?? ParameterOptionErrorMessage.WorkOrder
    );
    return [];
  }
};

const buildProjectOptions = async (): Promise<ParameterOption[]> => {
  try {
    const bases = await getParameterBaseByType(ParameterTypeEnum.Project);
    const mappedOptions = bases.map(base => ({
      label: base.name ?? "",
      value: base.name ?? ""
    }));
    return normalizeOptions(mappedOptions);
  } catch (error) {
    ElMessage.error(
      (error as Error)?.message ?? ParameterOptionErrorMessage.Project
    );
    return [];
  }
};

export function useParameterOptionsLoader() {
  const loadOptions = async (
    type: ParameterTypeEnum
  ): Promise<ParameterOption[]> => {
    if (type === ParameterTypeEnum.Process) {
      return buildProcessOptions();
    }
    if (type === ParameterTypeEnum.Craft) {
      return buildCraftOptions();
    }
    if (type === ParameterTypeEnum.WorkOrder) {
      return buildWorkOrderOptions();
    }
    if (type === ParameterTypeEnum.Project) {
      return buildProjectOptions();
    }
    return [];
  };

  return { loadOptions };
}
