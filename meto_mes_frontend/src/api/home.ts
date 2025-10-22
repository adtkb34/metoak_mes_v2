import { http } from "@/utils/http";

export enum WorkStage {
  FIT_PCBA = "fitpcba",
  CALIBRATION = "calibration",
  ASSEMBLE = "assemble",
  ADJUST = "adjust",
  AA = "aa",
  FQC = "finalcheck",
  OQC = "oqc",
  PACK_1 = "pack1",
  PACK_2 = "pack2"
}

export interface HistoryInfo {
  days: string;
  stage: WorkStage;
  num: string;
}

export interface TodayInfo {
  stage: WorkStage;
  num: number;
}

export function getHistoryInfo(): Promise<HistoryInfo[]> {
  return http.request("get", "/home/output-history");
}

export function getTodayInfo(): Promise<TodayInfo[]> {
  return http.request("get", "/home/output-today");
}


export function getProductInfo(tableName: string) {
  return http.request<number[]>("get", "/home/product-info", {
    params: {
      table: tableName
    }
  });
}
