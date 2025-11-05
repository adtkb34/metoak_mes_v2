import { http } from "@/utils/http";
import type { ShellSerialItem, TagCreationResponse, TagListResponse } from "types/tag";
import type { BeamSerialItem } from "types/tag";

export function getBeamSN(work_order_code: string) {
  return http.request<TagListResponse<BeamSerialItem>>("get", "/tag/beamSN", {
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

export function getShellSN(work_order_code: string) {
  return http.request<TagListResponse<ShellSerialItem>>("get", "/tag/shellSN", {
    params: {
      work_order_code
    }
  });
}

export function generatebeamSN(
  total: number,
  work_order_code: string,
  produced_order_id: number,
  beam_sn_prefix: string
): Promise<TagCreationResponse<BeamSerialItem>> {
  return http.request("post", "/tag/beamSN", {
    data: {
      total,
      work_order_code,
      produced_order_id,
      beam_sn_prefix
    }
  });
}

export function generateShellSN(data: {
  total: number;
  work_order_code: string;
  produce_order_id?: number;
  shell_sn_prefix: string;
  front_section?: string;
  operator?: string;
}): Promise<TagCreationResponse<ShellSerialItem>> {
  return http.request("post", "/tag/shellSN", {
    data
  });
}
