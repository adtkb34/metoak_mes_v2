// m55h.controller.ts
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { M55hService } from './m55h.service';
import { mo_success } from 'src/utils/response';

@Controller('m55h')
export class M55hController {
  constructor(private readonly m55hService: M55hService) {}
  private VERSION = "0.1.1";

  @Get("/is-sn-repeated")
  async isRepeated(@Query("sn") sn: string) {
    const res = await this.m55hService.isRepeated(sn);
    return mo_success(res);
  }

  @Post("/upload")
  async upload(@Body() body: any) {
    return await this.m55hService.create(body);
  }

  @Get("/page")
  async findPage(
    @Query("page") page: number = 1,
    @Query("pageSize") pageSize: number = 10,
    @Query("sn") sn?: string,
  ) {
    const res = await this.m55hService.findPage(+page, +pageSize, sn);
    return mo_success(res);
  }
}
