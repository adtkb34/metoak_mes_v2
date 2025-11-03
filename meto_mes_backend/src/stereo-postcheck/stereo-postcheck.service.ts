import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostCheckDto } from './dto';

@Injectable()
export class StereoPostcheckService {
    constructor(private prisma: PrismaService) { }

    async create(dto: PostCheckDto) {
        return await this.prisma.mo_stereo_postcheck.create({ data: dto });
    }

    async findBySn(sn: string): Promise<any[]> {
        // 先获取转换后的相机 SN
        const _sn = await this.transferToCameraSN(sn);

        // 封装查询函数
        const queryBySN = async (snValue: string): Promise<any[]> => {
            return this.prisma.mo_stereo_postcheck.findMany({
                where: { sn: snValue },
                orderBy: { datetime: 'desc' },
            });
        };

        // 先查原始 SN
        let rows = await queryBySN(sn);

        // 如果没有结果，查转换后的 SN
        if (rows.length === 0 && _sn && _sn !== sn) {
            rows = await queryBySN(_sn);
        }

        return rows;
    }

    async queryByDateAndSn(sn: string, startDate: Date, endDate: Date, page: number, pageSize: number) {
        const skip = (page - 1) * pageSize;

        const [data, total] = await Promise.all([
            this.prisma.mo_stereo_postcheck.findMany({
                where: {
                    sn,
                    datetime: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                orderBy: { datetime: 'desc' },
                skip,
                take: pageSize,
            }),
            this.prisma.mo_stereo_postcheck.count({
                where: {
                    sn,
                    datetime: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            }),
        ]);

        return { total, page, pageSize, data };
    }

    async transferToCameraSN(sn: string): Promise<string> {
        const res = await this.prisma.mo_tag_shell_info.findFirst({
            select: { camera_sn: true },
            where: { shell_sn: sn },
            orderBy: { operation_time: 'desc' }
        })
        return res?.camera_sn ?? '';
    }
}
