import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { StereoPostcheckService } from './stereo-postcheck.service';
import { PostCheckDto } from './dto';
import { ERROR_CODE, mo_fail, mo_success } from 'src/utils/response';

@Controller('stereo-postcheck')
export class StereoPostcheckController {
    constructor(private service: StereoPostcheckService) { }
    private VERSION = "0.1.0";

    @Post("create")
    async createData(@Body() dto: PostCheckDto) {
        if (!dto.sn) {
            return mo_fail("sn is empty");
        }

        try {
            const res = await this.service.create(dto);

            return mo_success(res);
        } catch (e) {
            console.log(e);
            return mo_fail(e, ERROR_CODE.FIELD_ERROR);
        }
    }

    /** 根据 SN 查询 */
    @Get('list')
    async getBySn(@Query('sn') sn: string) {
        if (!sn) {
            return mo_fail('missing sn');
        }

        try {
            const res = await this.service.findBySn(sn);
            return mo_success(res);
        } catch (e) {
            console.error(e);
            return mo_fail(e);
        }
    }

    /** 根据日期范围 + SN 分页查询 */
    @Get('query')
    async queryByDateAndSn(
        @Query('sn') sn: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('page') page = '1',
        @Query('pageSize') pageSize = '20',
    ) {
        if (!sn || !startDate || !endDate) {
            return mo_fail('missing required params (sn, startDate, endDate)');
        }

        try {
            const res = await this.service.queryByDateAndSn(
                sn,
                new Date(startDate),
                new Date(endDate),
                parseInt(page),
                parseInt(pageSize),
            );
            return mo_success(res);
        } catch (e) {
            console.error(e);
            return mo_fail(e);
        }
    }
}
