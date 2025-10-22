import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { StereoPrecheckService } from './stereo_precheck.service';
import { StereoDto } from './dto';
import { ERROR_CODE, mo_fail, mo_success } from 'src/utils/response';

@Controller('stereo_precheck_del')
export class StereoPrecheckController {
  constructor(private readonly service: StereoPrecheckService) { }
  private VERSION = "0.2.1";

  private NG = 1;

  @Post('/create')
  async create(@Body() dto: StereoDto) {
    console.log(dto);
    
    return await this.service.create(dto);
  }

  @Get()
  async getData(@Query("sn") sn: string) {
    if (!sn) {
      return mo_fail("sn is empty", -1);
    }

    try {
      const res = await this.service.getAll(sn);

      if (res.length === 0) {
        return mo_fail('database cannot find sn', ERROR_CODE.EMPTY_DATA);
      }

      let errorCode = 0;
      if(!res[0]?.error_code) return;
      
      if(res[0].error_code != 0)
        errorCode = this.NG;

      return !errorCode ? mo_success(res) : mo_fail("NG", this.NG);
    } catch (e) {
      console.log(e);
      return mo_fail('server interval error', -2);
    }
  }

  @Get('/page')
  async findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    return this.service.findAll({
      startDate,
      endDate,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    });
  }
}
