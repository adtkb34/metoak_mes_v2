import type {
  ParamsContent,
  ParamsDetail,
  ParamsVersionItem
} from "@/api/params";

export enum ParameterTypeEnum {
  Process = 1,
  Craft = 2,
  WorkOrder = 3,
  Project = 4
}

export const PARAMETER_TYPE_LABELS: Record<ParameterTypeEnum, string> = {
  [ParameterTypeEnum.Process]: "工序",
  [ParameterTypeEnum.Craft]: "工艺",
  [ParameterTypeEnum.WorkOrder]: "工单",
  [ParameterTypeEnum.Project]: "工程"
};

export const PARAMETER_TYPE_OPTIONS: ParameterTypeOption[] = Object.entries(
  PARAMETER_TYPE_LABELS
).map(([value, label]) => ({
  label,
  value: Number(value) as ParameterTypeEnum
}));

export type ParameterTypeOption = {
  label: string;
  value: ParameterTypeEnum;
};

export enum ParameterDialogMode {
  Create = "create",
  Edit = "edit"
}

export interface ParameterOption {
  label: string;
  value: string | number;
}

export interface ParameterFormState {
  name: string;
  description: string;
  content: string;
  type: ParameterTypeEnum;
  relationId: string | number | null;
}

export enum ParameterRelationField {
  FlowNo = "flowNo",
  OrderId = "orderId",
  StepTypeNo = "stepTypeNo"
}

export interface ParameterListQuery {
  type: ParameterTypeEnum;
  flowNo?: string | number | null;
  orderId?: string | number | null;
  stepTypeNo?: string | number | null;
}

export interface ParameterRow {
  id?: number | string;
  paramsId?: string | number;
  type: ParameterTypeEnum;
  relationId?: string | number | null;
  relationName?: string;
  name: string;
  description?: string;
  versionLabel: string;
  createdBy?: string;
  createdAt?: string;
}

export interface ParameterDetailState extends ParameterRow {
  content: ParamsContent;
}

export interface ParameterDialogDefaults {
  type: ParameterTypeEnum;
  relationId: string | number | null;
  relationName?: string;
  relationOptions?: ParameterOption[];
}

export type ParameterDetailResponse = ParamsDetail & {
  content?: ParamsContent;
};

export type ParameterVersionResponse = ParamsVersionItem & {
  paramsId?: string | number | null;
};

export interface ParameterListItem extends ParamsVersionItem {
  id?: number | string;
  relation?: string;
  relationId?: string | number | null;
  paramsId?: string | number | null;
  name: string;
  createdBy?: string;
  createdAt?: string;
}
