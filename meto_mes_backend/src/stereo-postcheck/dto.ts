import { IsString, IsInt, IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class PostCheckDto {
  @IsDateString()
  datetime: string;

  @IsString()
  sn: string;

  @IsInt()
  error_code: number;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsInt()
  station?: number;

  @IsOptional()
  @IsBoolean()
  is_version_ok?: boolean;

  @IsOptional()
  @IsBoolean()
  is_image_ok?: boolean;
}
