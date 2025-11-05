export interface OrderListItem {
  id: number;
  work_order_code: string;
  material_code: string;
  produce_count: number;
  completed_count: number;
}

export interface BeamSerialItem {
  beam_sn: string;
}

export interface ShellSerialItem {
  tag_sn: string;
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