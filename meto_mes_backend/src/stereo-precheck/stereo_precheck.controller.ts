import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { StereoPrecheckService } from './stereo_precheck.service';
import { StereoDto } from './dto';
import { ERROR_CODE, mo_fail, mo_success } from 'src/utils/response';
import { InformationInquiryService } from 'src/information-inquiry/information-inquiry.service';
import { isS316Shell, SnType } from 'src/utils/sn';

@Controller(['stereo-precheck', 'stereo_precheck'])
export class StereoPrecheckController {
  constructor(private readonly service: StereoPrecheckService, private readonly tranceService: InformationInquiryService) { }
  private VERSION = "0.3.0";

  private NG = 1;

  @Post('/create')
  create(@Body() dto: StereoDto) {
    return this.service.create(dto);
  }

  @Get()
  async getData(@Query("sn") sn: string) {
    if (!sn) {
      return mo_fail("sn is empty", -1);
    }

    const isShellSn = isS316Shell(sn);
    if (isShellSn) {
      const sns = await this.tranceService.getRelatedSerialNumber(sn);
      sn = sns.filter(item => item.type === SnType.BEAM)[0].name;

      if (!sn) {
        return mo_fail("sn trace error", ERROR_CODE.TRACE_ERROR);
      }
    }

    try {
      const res = await this.service.getAll(sn);
      console.log(res);
      

      if (res.length === 0) {
        return mo_fail('database cannot find sn', ERROR_CODE.EMPTY_DATA);
      }

      let errorCode = 0;

      if (res[0].error_code != 0) {
        errorCode = this.NG;
      }

      return !errorCode ? mo_success(res[0]) : mo_fail("NG", this.NG);
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
    @Query('isPrecheck') isPrecheck: string = '1',
  ) {
    const queryMethod = parseInt(isPrecheck) === 1
      ? this.service.findAllPrecheck.bind(this.service)
      : this.service.findAllOQC.bind(this.service);

    return queryMethod({
      startDate,
      endDate,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    });
  }

  @Get('/list-oqc')
  async getOQC(@Query("sn") sn: string) {
    const res = await this.service.findOQC(sn);
    return mo_success(res);
  }

  @Get('/list-performance')
  async getPerf(@Query("sn") sn) {
    const res = await this.service.findPerfc(sn);
    return mo_success(res);
  }
}
