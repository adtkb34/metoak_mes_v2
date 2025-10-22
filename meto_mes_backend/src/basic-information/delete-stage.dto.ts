import { ArrayNotEmpty, IsArray, IsNumber, IsString } from "class-validator";

export class DeleteStageDto {
    @IsNumber()
    user_level: number;

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    stage_codes: string[];
}