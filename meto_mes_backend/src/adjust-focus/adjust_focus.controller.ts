import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AdjustFocusService } from './adjust_focus.service';
import { mo_success, mo_fail, ERROR_CODE } from 'src/utils/response';

@Controller('adjust-focus')
export class AdjustFocusController {
  constructor(private readonly service: AdjustFocusService) { }

  @Get()
  async getData(@Query("sn") sn) {
    if (!sn) {
      return mo_fail("sn is empty", ERROR_CODE.EMPTY_DATA);
    }

    try {
      console.log(sn);
      
      const data = await this.service.getDataBySn(sn);

      if (data) {
        return mo_success(data);
      }
      return mo_fail("database cannot find sn: " + sn, ERROR_CODE.EMPTY_DATA);
    } catch (e) {
      return mo_fail(e, ERROR_CODE.FIELD_ERROR);
    }
  }

  @Post("upload")
  async upload(@Body() dto) {
    if (!dto.camera_sn) {
      return mo_fail("data is empty", ERROR_CODE.EMPTY_DATA);
    }

    console.log(dto);
    try {

      const res = await this.service.create(dto);

      return mo_success();
    } catch (e) {
      console.log(e);
      
      return mo_fail(e, ERROR_CODE.FIELD_ERROR);
    }
  }
}
