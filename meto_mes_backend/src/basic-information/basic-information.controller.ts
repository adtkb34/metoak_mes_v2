import { Body, Controller, Delete, ForbiddenException, Get, Patch, Post, Query } from '@nestjs/common';
import { ProductOrigin } from '../common/enums/product-origin.enum';
import { BasicInformationService } from './basic-information.service';
import { ProcessStep } from './type';
import { UpdateStageDto } from './update-stage.dto';
import { DeleteStageDto } from './delete-stage.dto';
import { CreateProcessDto } from './create-flow.dto';

@Controller('basic-information')
export class BasicInformationController {
  constructor(private readonly service: BasicInformationService) {}

  @Get('/process-stages')
  getProcessManagement() {
    return this.service.getProcessManagement();
  }

  @Delete('/process-stages')
  deleteProcessSteps(@Body() dto: DeleteStageDto) {
    this.validate(dto.user_level);

    return this.service.deleteProcessSteps(dto.stage_codes);
  }

  @Patch('process-stage')
  updateProcessSteps(
    @Query('stage_code') stage_code: string,
    @Query('user_level') user_level: number,
    @Body() dto: UpdateStageDto
  ) {
    this.validate(user_level);

    return this.service.updateProcessStep(stage_code, dto);
  }

  @Post('/process-stage')
  addProcessStep(@Body() processStep: ProcessStep) {
    this.validate(processStep.user_level);
    return this.service.addProcessStep(processStep);
  }

  // 批量删除工艺流程
  @Delete('process-flow')
  async deleteProcessFlow(
    @Query('user_level') user_level: number,
    @Query('process_code') process_code: string
  ) {
    this.validate(user_level);

    return this.service.deleteProcessFlow(process_code);
  }

  @Patch('process-flow')
  async batchUpdate(
    @Query('user_level') user_level: number,
    @Body() processes: CreateProcessDto[],
  ) {
    this.validate(user_level);

    const process_code = processes[0].process_code.toString();
    await this.service.deleteProcessFlow(process_code);
    
    return this.service.batchInsertProcessFlow(processes);
  }

  // 批量插入工艺流程
  @Post('process-flow')
  async batchInsert(
    @Query('user_level') user_level: number,
    @Body() processes: CreateProcessDto[],
  ) {
    this.validate(user_level);

    return this.service.batchInsertProcessFlow(processes);
  }

  @Get('process-flow')
  async getProcessFlow(@Query('origin') originParam?: string) {
    const origin = this.parseOrigin(originParam);

    const processFlow = await this.service.getProcessFlow(origin);
    const steps = await this.service.getProcessManagement();

    const grouped = Object.values(
      processFlow.reduce(
        (acc, { process_code, process_name, stage_code, process_desc }) => {
          if (!process_code || !stage_code || !process_name || !process_desc)
            return acc;

          if (!acc[process_code]) {
            acc[process_code] = {
              process_code,
              process_name,
              stage_codes: [],
              process_desc,
            };
          }

          const step = steps.find(step => step.stage_code === stage_code);
          acc[process_code].stage_codes.push(step?.stage_name ?? '');
          return acc;
        },
        {} as Record<
          string,
          {
            process_code: string;
            process_name: string;
            stage_codes: string[];
            process_desc: string;
          }
        >,
      ),
    );

    return grouped;
  }

  private validate(user_level) {
    if (user_level === undefined || user_level > 1) {
      throw new ForbiddenException('Permission denied');
    }
  }

  private parseOrigin(value?: string | number | null): ProductOrigin | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const numeric = Number(value);
    if (!Number.isInteger(numeric)) {
      return undefined;
    }

    const allowedOrigins = Object.values(ProductOrigin).filter(
      (item): item is ProductOrigin => typeof item === 'number',
    );

    return allowedOrigins.includes(numeric as ProductOrigin)
      ? (numeric as ProductOrigin)
      : undefined;
  }
}
