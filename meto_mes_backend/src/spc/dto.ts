import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateSpcConfigDto {
  @IsInt()
  user_name: string;

  @IsInt()
  station: number;

  @IsString()
  table_name: string;

  @IsString()
  field_name: string;

  @IsOptional()
  @IsNumber()
  usl?: number;

  @IsOptional()
  @IsNumber()
  lsl?: number;

  @IsInt()
  subgroup_length: number;

  @IsInt()
  rules: number;

  @IsBoolean()
  is_real_time: boolean;

  @IsInt()
  statistics_length: number;

  @IsInt()
  position: number;
}

export class UpdateSpcConfigDto {
  user_name?: string | null;
  station?: number | null;
  table_name?: string | null;
  field_name?: string | null;
  usl?: number | null;
  lsl?: number | null;
  subgroup_length?: number | null;
  rules?: number | null;
  is_real_time?: boolean | null;
  statistics_length?: number | null;
  position?: number | null;
}
