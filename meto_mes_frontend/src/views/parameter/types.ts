import type { ParamsContent, ParamsDetail, ParamsVersionItem } from "@/api/params";

export enum ParameterTypeEnum {
  Process = 0,
  Craft = 1,
  WorkOrder = 2,
  Project = 3
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

export interface ParameterRow {
  id?: number;
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

export type ParameterDetailResponse = ParamsDetail & {
  content?: ParamsContent;
};

export type ParameterVersionResponse = ParamsVersionItem & {
  paramsId?: string | number | null;
};
