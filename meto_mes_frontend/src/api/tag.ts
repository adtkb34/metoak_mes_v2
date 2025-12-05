import { http } from "@/utils/http";
import type {
  BeamSerialItem,
  LabelType,
  MarkSerialPayload,
  OrderListItem,
  ShellSerialItem,
  ShellTagConfig,
  ShellTagConfigPayload,
  TagCreationResponse,
  TagListResponse
} from "types/tag";

export function getBeamSN(
  work_order_code: string,
  label_type: LabelType = "beam",
  only_unused = false
) {
  return http.request<TagListResponse<BeamSerialItem | ShellSerialItem>>("get", "/tag/SN", {
    params: {
      work_order_code,
      label_type,
      only_unused
    }
  });
}

export function getTagOrders() {
  return http.request<OrderListItem[]>("get", "/tag/allOrders");
}

export function getBeamMaterialCode(work_order_code: string) {
  return http.request("get", "/tag/beamMaterialCode", {
    params: {
      work_order_code: work_order_code
    }
  });
}

export function getShellSN(work_order_code: string, only_unused = false) {
  return http.request<TagListResponse<ShellSerialItem>>("get", "/tag/shellSN", {
    params: {
      work_order_code,
      only_unused
    }
  });
}

export function getShellTagConfig(params: ShellTagConfigPayload) {
  return http.request<ShellTagConfig | null>("get", "/tag/shellConfig", {
    params
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
  serial_prefix: string;
  front_section?: string;
  operator?: string;
}): Promise<TagCreationResponse<ShellSerialItem>> {
  return http.request("post", "/tag/shellSN", {
    data
  });
}

export function saveShellTagConfig(data: ShellTagConfigPayload) {
  return http.request<ShellTagConfig>("post", "/tag/shellConfig", {
    data
  });
}

export function markSerialNumbersUsed(data: MarkSerialPayload) {
  return http.request("post", "/tag/markUsed", {
    data
  });
}
