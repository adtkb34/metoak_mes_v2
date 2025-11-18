export interface ShellInfoDTO {
  user_level: number;
  total: number;
  work_order_code: string;
  produced_order_id?: number;
  shell_sn_prefix: string;
  serial_prefix: string;
  front_section?: string;
  operator?: string;
}
