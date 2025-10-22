import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StereoDto } from './dto';

@Injectable()
export class StereoPrecheckService {
  constructor(private prisma: PrismaService) { }

  create(dto: StereoDto) {
    let time_: any = dto.datetime;

    // 如果是数字（时间戳），直接 new Date
    if (Number(time_)) {
      time_ = new Date(Number(time_));
    } else if (typeof time_ === 'string') {
      // 把 "2025-08-05 18:04:59" 转成 ISO 格式
      time_ = new Date(time_.replace(' ', 'T')); // => "2025-08-05T18:04:59"
    }

    console.log('Parsed datetime:', time_);

    return this.prisma.mo_stereo_precheck.create({
      data: {
        ...dto,
        datetime: time_
      },
    });
  }

async getAll(sn: string) {
  return this.prisma.$queryRaw<
    any[]
  >`SELECT * FROM view_stereo_precheck_perfc WHERE sn = ${sn} ORDER BY datetime DESC`;
}

  private buildDateWhere(startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      return {
        datetime: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }
    // 默认当天
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));
    return {
      datetime: { gte: start, lte: end },
    };
  }

  private oqcFilter = {
    is_clarity_detect_enabled: true,
    is_lo_detect_enabled: true,
    is_cod_detect_enabled: false,
    is_dirty_detect_enabled: false,
    is_color_cast_detect_enabled: false,
  };

  async findAllOQC({ startDate, endDate, page, pageSize }) {
    const where = {
      ...this.buildDateWhere(startDate, endDate),
      ...this.oqcFilter,
    };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.mo_stereo_precheck.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
      }),
      this.prisma.mo_stereo_precheck.count({ where }),
    ]);

    console.log(records);


    return new PaginationResult({
      total,
      page,
      pageSize,
      records,
    });
  }

  async findAllPrecheck({ startDate, endDate, page, pageSize }) {
    const where = this.buildDateWhere(startDate, endDate);

    const [records, total] = await this.prisma.$transaction([
      this.prisma.mo_stereo_precheck.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { datetime: 'desc' },
      }),
      this.prisma.mo_stereo_precheck.count({ where }),
    ]);

    return new PaginationResult({
      total,
      page,
      pageSize,
      records,
    });
  }
}

class PaginationResult<T> {
  total: number;     // 总记录数
  page: number;      // 当前页码
  pageSize: number;  // 每页数量
  records: T[];      // 当前页的数据

  constructor(partial: Partial<PaginationResult<T>>) {
    Object.assign(this, partial);
  }
}