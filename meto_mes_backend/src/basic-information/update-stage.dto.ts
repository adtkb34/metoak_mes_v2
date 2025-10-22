import { IsOptional, IsString } from "class-validator";

export class UpdateStageDto {
    @IsOptional()
    @IsString()
    stage_name?: string;

    @IsOptional()
    @IsString()
    stage_desc?: string;

    @IsOptional()
    @IsString()
    step_type_no?: string;

    @IsOptional()
    @IsString()
    target_table?: string;
}