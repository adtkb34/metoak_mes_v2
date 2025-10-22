export interface MoProduceOrder{
    id: number;
    work_order_code: string;
    order_date: string; // 注意：raw 查询返回的日期是 string
    material_code: string;
    material_name: string;
    model_type: string;
    produce_count: number;
    produce_unit: string;
    planned_starttime: string; // 这里是 string（可能是 '0000-00-00 00:00:00'）
    planned_endtime: string;
    flow_code: string;
}
