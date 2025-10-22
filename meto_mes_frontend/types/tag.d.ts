export interface OrderListItem {
  id: number,
  work_order_code: string,
  material_code: string,
  produce_count: number,
  completed_count: number
}

export type TagResponseType = { type: string, data: [], count: number };