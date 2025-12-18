export interface OrderListItem {
  id: number;
  work_order_code: string;
  material_code: string;
  material_name?: string;
  produce_count: number;
  completed_count: number;
}

export interface BeamSerialItem {
  id?: number;
  beam_sn: string;
  is_used?: number | null;
}

export interface ShellSerialItem {
  id?: number;
  tag_sn: string;
  is_used?: number | null;
}

export type LabelType = "beam" | "shell";

export interface ShellTagConfig {
  project_name: string;
  material_code: string;
  whole_machine_code: string | null;
  process_code: string | null;
  serial_prefix: string | null;
}

export interface ShellTagConfigPayload {
  material_code: string;
  project_name?: string;
  whole_machine_code?: string;
  process_code?: string;
  serial_prefix?: string;
}

export type TagCreationResponse<T> = {
  type: string;
  data: T[];
  count: number;
};

export type TagListResponse<T> = {
  data: T[];
  length: number;
};

export interface MarkSerialPayload {
  work_order_code: string;
  label_type: LabelType;
  serial_numbers: string[];
}