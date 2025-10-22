import { Body, Controller, Post } from '@nestjs/common';
import { StereoPostcheckService } from './stereo-postcheck.service';
import { PostCheckDto } from './dto';
import { ERROR_CODE, mo_fail, mo_success } from 'src/utils/response';

@Controller('stereo-postcheck')
export class StereoPostcheckController {
    constructor(private service: StereoPostcheckService) { }
    private VERSION = "0.1.0";

    @Post("create")
    async createData(@Body() dto: PostCheckDto) {
        console.log(dto);
        
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
}
