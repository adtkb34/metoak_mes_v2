import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TagService } from './tag.service';
import { BeamInfoDTO } from './beamInfo.dto';

@Controller('tag')
export class TagController {
    constructor(private tagService: TagService) { }

    @Get('/allOrders')
    getAllOrders() {
        return this.tagService.getAllOrders();
    }

    @Get('/beamSN')
    async getBeamSN(
        @Query('work_order_code') work_order_code: string
    ) {
        const result = await this.tagService.getBeamSN(work_order_code);

        return {
            data: result,
            length: result.length
        }
    }

    @Get('/beamMaterialCode')
    getBeamMaterialCode(
        @Query('work_order_code') work_order_code: string
    ) {
        return this.tagService.getBeamMaterialCode(work_order_code);
    }

    @Post('/generateSN')
    generateSN(
        @Body() dto: BeamInfoDTO
    ) {
        if (dto.user_level > 1) {
            return null;
        }
        return this.tagService.insertSerialRange(dto);
    }
}
