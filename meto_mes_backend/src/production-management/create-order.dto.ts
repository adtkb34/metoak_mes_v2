export class CreateMoProduceOrderDto {
    work_order_code?: string;
    order_date: string;
    material_code?: string;
    material_name?: string;
    model_type?: string;
    workshop?: string;
    produce_count?: number;
    produce_unit?: string;
    planned_starttime?: string;
    planned_endtime?: string;
    added_time?: Date;
    flow_code?: string;
    flow_assemble_shell?: number;
    bom_version?: string;
    schedule_state?: string;
    cmos_pn?: string;
    lens_sn?: string;
    fpga_version?: string;
    order_state?: number;
    completed_count?: number;
    product_type?: string;
}
