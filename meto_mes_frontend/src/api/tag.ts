import { http } from "@/utils/http";
import type { TagResponseType } from "types/tag";

export function getBeamSN(work_order_code: string) {
  return http.request("get", "/tag/beamSN", {
    params: {
      work_order_code: work_order_code
    }
  });
}

export function getBeamMaterialCode(work_order_code: string) {
  return http.request("get", "/tag/beamMaterialCode", {
    params: {
      work_order_code: work_order_code
    }
  });
}

export function generatebeamSN(
  total: number,
  work_order_code: string,
  produced_order_id: number,
  beam_sn_prefix: string
): Promise<TagResponseType> {
  return http.request("post", "/tag/beamSN", {
    data: {
      total,
      work_order_code,
      produced_order_id,
      beam_sn_prefix
    }
  });
}
