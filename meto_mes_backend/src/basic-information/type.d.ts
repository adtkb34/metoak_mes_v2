export interface ProcessStep {
    user_level: number,
    stage_code: string,
    stage_name: string,
    stage_desc: string,
    target_table: string,
    step_type_no: string
}

export interface ProcessFlow {
    user_level: number,
    process_code: string,
    process_name: string,
    stage_codes: string[],
    process_desc: string
}
