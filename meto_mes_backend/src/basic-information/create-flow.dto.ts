// create-process.dto.ts
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateProcessDto {
  @IsString()
  process_code: string;

  @IsString()
  process_name: string;

  @IsString()
  stage_code: string;

  @IsOptional()
  @IsString()
  process_desc?: string;
}