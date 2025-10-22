import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateStageDto {
  @IsString()
  stage_name: string;

  @IsOptional()
  @IsString()
  stage_code?: string;

  @IsOptional()
  @IsString()
  stage_desc?: string;

  @IsOptional()
  @IsInt()
  show_report?: number;

  @IsOptional()
  @IsBoolean()
  show_ptype?: boolean;

  @IsOptional()
  @IsBoolean()
  manual_result?: boolean;

  @IsOptional()
  @IsString()
  sys_step_type_no?: string;

  @IsOptional()
  @IsString()
  target_table?: string;

  @IsOptional()
  @IsString()
  step_type_no?: string;
}

export class UpdateStageDto extends CreateStageDto {}
