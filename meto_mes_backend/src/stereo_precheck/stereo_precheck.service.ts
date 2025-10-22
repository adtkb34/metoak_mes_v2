import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StereoDto } from './dto';

@Injectable()
export class StereoPrecheckService {
  constructor(private prisma: PrismaService) { }

  async create(dto: StereoDto) {
    let timestamp = 0;
    const offset = 8 * 60 * 60 * 1000;
    if (dto.datetime) {
      timestamp = Number(dto.datetime);
    }
    console.log("db");
    
    const res = await this.prisma.mo_stereo_precheck.create({
      data: {
        ...dto,
        datetime: timestamp === 0 ? '' : new Date(timestamp + offset)
      },
    });
    console.log(res);
    
    return res;
  }

  async getAll(sn: string) {
    return await this.prisma.mo_stereo_precheck.findMany({
      where: {
        sn: sn
      },
      orderBy: {datetime: 'desc'}
    })
  }

  async findAll({ startDate, endDate, page, pageSize }) {
    const where: any = {};
    if (startDate && endDate) {
      where.datetime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      // 默认当天数据
      const today = new Date();
      const start = new Date(today.setHours(0, 0, 0, 0));
      const end = new Date(today.setHours(23, 59, 59, 999));
      where.datetime = {
        gte: start,
        lte: end,
      };
    }

    const [total, records] = await Promise.all([
      this.prisma.mo_stereo_precheck.count({ where }),
      this.prisma.mo_stereo_precheck.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { datetime: 'desc' },
      }),
    ]);

    return { total, records };
  }
}
