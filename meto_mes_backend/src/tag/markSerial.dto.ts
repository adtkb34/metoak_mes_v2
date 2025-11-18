export interface MarkSerialDTO {
  work_order_code: string;
  label_type: 'beam' | 'shell';
  serial_numbers: string[];
}
