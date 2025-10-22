import { Controller, Get, Query } from '@nestjs/common';
import { DataAnalysisService } from './data-analysis.service';

@Controller('data-analysis')
export class DataAnalysisController {
    constructor(private readonly dataService: DataAnalysisService) { }

    @Get('oqc')
    async getOQCInfo(
        @Query('start') start: Date,
        @Query('end') end: Date
    ) {
        const result =
            await this.dataService.getOQCInfo(new Date(start), new Date(end))

            return result.map(item => {
                if (item.camera_sn.substring(0, 4) != 'S315')
                    return item.camera_sn
            })
        return {
            total: result.reduce((acc, { camera_sn }) => {
                const prefixMap = {
                    'S315': 's315',
                    'S330': 's330'
                };
                const key = prefixMap[camera_sn.slice(0, 4).toUpperCase()] || 'unknown';
                acc[key]++;
                return acc;
            }, { s315: 0, s330: 0, unknown: 0 }),
            degrade: result
                .map(item => item.check_result)
                .reduce((acc, val) => {
                    val ? acc.true++ : acc.false++;
                    return acc;
                }, { true: 0, false: 0 }),
        }
    }

    @Get('wip')
    getWIPInfo() {

    }
}
