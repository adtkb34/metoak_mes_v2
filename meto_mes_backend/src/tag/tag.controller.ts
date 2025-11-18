import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TagService } from './tag.service';
import { BeamInfoDTO } from './beamInfo.dto';
import { ShellInfoDTO } from './shellInfo.dto';
import { ShellConfigDTO } from './shellConfig.dto';
import { MarkSerialDTO } from './markSerial.dto';

@Controller('tag')
export class TagController {
  constructor(private tagService: TagService) {}

  @Get('/allOrders')
  getAllOrders() {
    return this.tagService.getAllOrders();
  }

  private parseOnlyUnusedFlag(value?: string) {
    if (value === undefined) return false;
    return value === 'true' || value === '1';
  }

  @Get('/beamSN')
  async getBeamSN(
    @Query('work_order_code') work_order_code: string,
    @Query('label_type') label_type = 'beam',
    @Query('only_unused') only_unused?: string,
  ) {
    const result = await this.tagService.getBeamSN(
      work_order_code,
      label_type,
      this.parseOnlyUnusedFlag(only_unused),
    );

    return {
      data: result,
      length: result.length,
    };
  }

  @Get('/beamMaterialCode')
  getBeamMaterialCode(@Query('work_order_code') work_order_code: string) {
    return this.tagService.getBeamMaterialCode(work_order_code);
  }

  @Get('/shellConfig')
  getShellConfig(
    @Query('material_code') material_code: string,
    @Query('project_name') project_name?: string,
  ) {
    return this.tagService.getShellConfig(material_code, project_name);
  }

  @Get('/shellSN')
  async getShellSN(
    @Query('work_order_code') work_order_code: string,
    @Query('only_unused') only_unused?: string,
  ) {
    const result = await this.tagService.getShellSN(
      work_order_code,
      this.parseOnlyUnusedFlag(only_unused),
    );

    return {
      data: result,
      length: result.length,
    };
  }

  @Post('/beamSN')
  generateBeamSN(@Body() dto: BeamInfoDTO) {
    if (dto.user_level > 1) {
      return null;
    }
    console.log(dto);
    return this.tagService.insertSerialRange(dto);
  }

  @Post('/shellSN')
  generateShellSN(@Body() dto: ShellInfoDTO) {
    if (dto.user_level > 1) {
      return null;
    }
    return this.tagService.insertShellSerialRange(dto);
  }

  @Post('/shellConfig')
  saveShellConfig(@Body() dto: ShellConfigDTO) {
    return this.tagService.saveShellConfig(dto);
  }

  @Post('/markUsed')
  markSerialNumbersAsUsed(@Body() dto: MarkSerialDTO) {
    return this.tagService.markSerialNumbersAsUsed(dto);
  }
}
