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

export interface TraceabilityProcessStep {
  stageCode: string;
  processName: string | null;
  stageName: string | null;
  stepTypeNo: string;
  data: TraceabilityProcessRecord[];
}

export interface TraceabilityFlow {
  serialNumber: string;
  type: string;
  workOrderCode: string | null;
  flowCode: string | null;
  steps: TraceabilityProcessStep[];
}

export interface TraceabilityResponse {
  base: TraceabilityBaseOption[];
  materials: TraceabilityMaterialInfo[];
  flow: TraceabilityFlow | null;
}

export interface TraceabilityQuery {
  serialNumber: string;
  processCode?: string;
}

export function getTraceability(params: TraceabilityQuery) {
  return http.request<TraceabilityResponse>("get", "/traceability", {
    params
  });
}
