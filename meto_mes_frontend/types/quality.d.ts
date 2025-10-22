export interface QualityFormData {
  passRate: number,
  qualificationRate: number,
  defects: number,
  total: number
}

export type RawItem = { camera_sn?: string; beam_sn?: string; error_code: number };

export type NormalizedItem = { camera_sn: string; error_code: number };
export type NormalizedItemWithDesc = NormalizedItem & { description: string };
