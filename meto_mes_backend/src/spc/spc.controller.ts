import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { SpcService } from './spc.service';
import { CreateSpcConfigDto, UpdateSpcConfigDto } from './dto';
import { table } from 'console';

@Controller('spc')
export class SpcController {
  constructor(private readonly spcService: SpcService) { }

  @Get('steps')
  getAvailableSteps() {
    return this.spcService.getAvailableSteps();
  }

  @Get('attrs')
  async getAvailableFields(
    @Query('stepNo') stepNo: string,
  ) {
    const res = await this.spcService.getAvailableFields(stepNo);
    return res.filter(item => {
      return item.key !== 'id'
        && item.key !== 'stage'
        && item.key !== 'stains'
        && item.key !== 'beam_sn'
        && item.key !== 'oven_no'
        && item.key !== 'tray_no'
        && item.key !== 'error_code'
        && item.key !== 'ng_reason'
        && item.key !== 'TimeStamp'
        && item.key !== 'CameraSN'
        && item.key !== 'station_num'
        && item.key !== 'position'
        && item.key !== 'image_path'
        && item.key !== 'add_time'
        && item.key !== 'gripper_number'
        && item.key !== 'laser_template_no'
        && item.key !== 'contamination_level'
        && item.key !== 'mo_process_step_production_result_id'
        && !item.key.includes('usl')
        && !item.key.includes('lsl')
        && !item.key.includes('min')
        && !item.key.includes('max')
        && !item.key.includes('spec')
        && !item.key.includes('code')
    })
  }

  @Get('series')
  async getSingleFieldSeries(
    @Query('stepNo') stepNo: string,
    @Query('field') field: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('position') position: string = '0',
    @Query('limit') limit?: string,
  ) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    // if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    //   throw new BadRequestException('Invalid date range');
    // }

    const limitNum = limit ? parseInt(limit) : 50;

    const result = await this.spcService.getFieldSeries(stepNo, field, startDate, endDate, limitNum);
    console.log(result);

    return result
      .filter(item => item.position === position)
      .filter(item => {
        if (!item?.error_code) {
          return !item.error_no;
        } else {
          return !item.error_code
        }
      })
      .map((item) => item.val)
      .filter(item => item);
  }

  @Get()
  getAllSpcItems() {
    return this.spcService.findAll().map(item => ({
      id: item.id,
      title: item.title
    }));
  }

  @Get('limits')
  async getLimits(
    @Query('field') field: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('limit') limit?: string
  ) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date range');
    }

    const limitNum = limit ? parseInt(limit) : 100;

    return await this.spcService.getEstimatedLimits(field, startDate, endDate, limitNum);
  }

  @Get('config')
  async getConfigs(
    @Query('userId') userId: string,
    @Query('tableName') tableName?: string,
    @Query('field') field?: string,
  ) {
    const res = await this.spcService.getConfigs(userId, tableName, field);
    return res;
  }

  @Get(':id')
  getSpcItem(@Param('id') id: string, @Query('length') length?: string) {
    const item = this.spcService.findOne(id);
    if (!item) return { error: 'Not found' };

    const len = Number(length);
    const data = len ? item.data.slice(-len) : item.data;

    return {
      id: item.id,
      title: item.title,
      usl: item.usl,
      lsl: item.lsl,
      data
    };
  }

  @Post('config')
  async setConfig(@Body() dto: CreateSpcConfigDto) {
    const res = await this.spcService.setConfig(dto);
    console.log(res);
    
    return res;
  }

  @Put('config')
  async updateConfig(@Body() dto: UpdateSpcConfigDto) {
    const res = await this.spcService.updateConfig(dto);
    return
    return res;
  }
}
