import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdjustFocusService {

    constructor(private readonly prisma: PrismaService) { }

    async getDataBySn(sn: string) {
        const res = await this.prisma.mo_adjust_focus.findMany(
            {
                where: {
                    camera_sn: sn
                }
            }
        )

        return res.map(item => ({
            ...item,
            id: item.id.toString()
        }))
    }

    async create(dto) {
        return await this.prisma.mo_adjust_focus.create({
            data: dto
        })
    }
}
