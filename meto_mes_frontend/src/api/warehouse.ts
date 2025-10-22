import { baseUrlApi } from "@/router/utils";
import { http } from "@/utils/http";

export type PackingInfo = {
  packing_code: string;
  operator: string;
  start_time: string;
  num: number;
};

export function getPackingInfo(params: {
  start?: string;
  end?: string;
  packing_code?: string;
  camera_sn_list?: string[];
}) {
  return http.request('post', "/warehouse-management/packing-info", {
    params,
    data: {
      camera_sn_list: params.camera_sn_list
    }
  });
}

export const getCameraSN = (packing_code: string) => {
  return http.request<{ camera_sn: string }[]>("get", "/warehouse-management/camera-sn", {
    params: {
      packing_code
    }
  });
};

export const deleteCameraSN = (camera_sn_list: string[]) => {
  return http.request("delete", "/warehouse-management/camera-sn", {
    data: {
      camera_sn_list
    }
  });
};

export const return_repair = (camera_sn_list: string[], repair_date: string) => {
  return http.request("put", "/warehouse-management/return-repair", {
    data: {
      camera_sn_list,
      repair_date
    }
  });
};

