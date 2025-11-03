import { http } from "@/utils/http";

export interface TraceabilityBaseOption {
  label: string;
  value: string | null;
}

export interface TraceabilityMaterialInfo {
  material: string;
  batchNo: string;
  time: string | null;
}

export type TraceabilityProcessRecord = Record<string, any>;

export interface TraceabilityProcessStepSummary {
  stageCode: string;
  processName: string | null;
  stageName: string | null;
  stepTypeNo: string;
}

export interface TraceabilityFlowSummary {
  serialNumber: string;
  type: string;
  workOrderCode: string | null;
  flowCode: string | null;
  steps: TraceabilityProcessStepSummary[];
}

export interface TraceabilityBaseResponse {
  base: TraceabilityBaseOption[];
  flow: TraceabilityFlowSummary | null;
}

export interface TraceabilityProcessStepDataResponse {
  stepTypeNo: string;
  data: TraceabilityProcessRecord[];
}

export interface TraceabilityMaterialCodeResponse {
  serialNumber: string;
  workOrderCode: string | null;
  materialCode: string | null;
}

export interface TraceabilityQuery {
  serialNumber: string;
  processCode?: string;
}

export interface TraceabilityProcessQuery extends TraceabilityQuery {
  stepTypeNo: string;
}

export function getTraceabilityBase(params: TraceabilityQuery) {
  return http.request<TraceabilityBaseResponse>("get", "/traceability/base", {
    params
  });
}

export function getTraceabilityMaterials(params: { serialNumber: string }) {
  return http.request<TraceabilityMaterialInfo[]>(
    "get",
    "/traceability/materials",
    { params }
  );
}

export function getTraceabilityProcess(params: TraceabilityProcessQuery) {
  return http.request<TraceabilityProcessStepDataResponse>(
    "get",
    "/traceability/process",
    { params }
  );
}

export function getTraceabilityMaterialCode(params: { serialNumber: string }) {
  return http.request<TraceabilityMaterialCodeResponse>(
    "get",
    "/traceability/material-code",
    { params }
  );
}
