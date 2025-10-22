import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DataAnalysisService {
    constructor(private readonly prisma: PrismaService) { }

    async getOQCInfo(start: Date, end: Date) {
        return this.prisma.mo_oqc_info.findMany({
            where: {
                start_time: {
                    gte: start,
                    lte: end
                },
            }
        })
    }

    async getWIPInfo() {

    }

    async getSPCInfo() {

    }
}
