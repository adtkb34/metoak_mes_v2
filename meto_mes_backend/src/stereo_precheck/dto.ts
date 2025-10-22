import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsInt,
  IsBoolean,
} from 'class-validator';

export class QueryPrecheckDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class StereoDto {
  @IsOptional()
  @IsDateString()
  datetime?: string;

  @IsOptional()
  @IsString()
  sn?: string;

  @IsOptional()
  @IsInt()
  error_code?: number;

  // === Dirty ===
  @IsOptional()
  @IsBoolean()
  is_dirty_detect_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  dirty_standard_cof?: number;

  @IsOptional()
  @IsInt()
  dirty_count_left?: number;

  @IsOptional()
  @IsInt()
  dirty_count_right?: number;

  // === Clarity ===
  @IsOptional()
  @IsBoolean()
  is_clarity_detect_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  clarity_left?: number;

  @IsOptional()
  @IsNumber()
  clarity_right?: number;

  @IsOptional()
  @IsNumber()
  clarity_standard_val?: number;

  @IsOptional()
  @IsNumber()
  clarity_standard_mdiff?: number;

  // === LO Clarity ===
  @IsOptional()
  @IsBoolean()
  is_lo_detect_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  lo_medium?: number;

  @IsOptional()
  @IsNumber()
  lo_mean?: number;

  @IsOptional()
  @IsNumber()
  lo_max?: number;

  @IsOptional()
  @IsNumber()
  lo_min?: number;

  @IsOptional()
  @IsNumber()
  lo_stddev?: number;

  @IsOptional()
  @IsNumber()
  lo_standard_val?: number;

  // === X Offset ===
  @IsOptional()
  @IsNumber()
  x_offset_medium?: number;

  @IsOptional()
  @IsNumber()
  x_offset_mean?: number;

  @IsOptional()
  @IsNumber()
  x_offset_max?: number;

  @IsOptional()
  @IsNumber()
  x_offset_min?: number;

  @IsOptional()
  @IsNumber()
  x_offset_stddev?: number;

  @IsOptional()
  @IsNumber()
  x_offset_standard_val?: number;

  @IsOptional()
  @IsNumber()
  x_offset_standard_tolerance?: number;

  // === Color Cast Mean ===
  @IsOptional()
  @IsNumber()
  color_cast_r_mean_left?: number;

  @IsOptional()
  @IsNumber()
  color_cast_g_mean_left?: number;

  @IsOptional()
  @IsNumber()
  color_cast_b_mean_left?: number;

  @IsOptional()
  @IsNumber()
  color_cast_r_mean_right?: number;

  @IsOptional()
  @IsNumber()
  color_cast_g_mean_right?: number;

  @IsOptional()
  @IsNumber()
  color_cast_b_mean_right?: number;

  // === Color Cast Stddev ===
  @IsOptional()
  @IsNumber()
  color_cast_r_stddev_left?: number;

  @IsOptional()
  @IsNumber()
  color_cast_g_stddev_left?: number;

  @IsOptional()
  @IsNumber()
  color_cast_b_stddev_left?: number;

  @IsOptional()
  @IsNumber()
  color_cast_r_stddev_right?: number;

  @IsOptional()
  @IsNumber()
  color_cast_g_stddev_right?: number;

  @IsOptional()
  @IsNumber()
  color_cast_b_stddev_right?: number;

  // === Color Cast Standard ===
  @IsOptional()
  @IsBoolean()
  is_color_cast_detect_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  color_cast_standard_r_center?: number;

  @IsOptional()
  @IsNumber()
  color_cast_standard_r_tolerance?: number;

  @IsOptional()
  @IsNumber()
  color_cast_standard_g_center?: number;

  @IsOptional()
  @IsNumber()
  color_cast_standard_g_tolerance?: number;

  @IsOptional()
  @IsNumber()
  color_cast_standard_b_center?: number;

  @IsOptional()
  @IsNumber()
  color_cast_standard_b_tolerance?: number;

  // === COD ===
  @IsOptional()
  @IsBoolean()
  is_cod_detect_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  cod_x_left?: number;

  @IsOptional()
  @IsNumber()
  cod_y_left?: number;

  @IsOptional()
  @IsNumber()
  cod_x_right?: number;

  @IsOptional()
  @IsNumber()
  cod_y_right?: number;

  // === COD Standard ===
  @IsOptional()
  @IsNumber()
  cod_standard_x_center?: number;

  @IsOptional()
  @IsNumber()
  cod_standard_x_tolerance?: number;

  @IsOptional()
  @IsNumber()
  cod_standard_y_center?: number;

  @IsOptional()
  @IsNumber()
  cod_standard_y_tolerance?: number;
}
