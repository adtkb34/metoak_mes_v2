// m55h.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class M55hService {
  constructor(private readonly prisma: PrismaService) {}

  async isRepeated(sn: string) {
    const res = await this.prisma.final_check_mono_m55h.findFirst({
      where: { sn },
    });
    return Boolean(res);
  }

  async create(data: any) {
    return await this.prisma.final_check_mono_m55h.create({
      data: {
        datetime: new Date(),
        sn: data.sn,
        error_code: data.error_code,
        operator: data.operator,
        image_ok: data.image_ok,
        image_path: data.image_path,
        check_result: data.check_result,
        can0_ok: data.can0_ok,
        can1_ok: data.can1_ok,
        version_adas: data.version_adas,
        version_spi: data.version_spi,
        version_mcu: data.version_mcu,
        focus: data.focus,
        baseline: data.baseline,
        product_version: data.version_product,
        pack_version: data.version_pack,
      },
    });
  }

  async findPage(page: number, pageSize: number, sn?: string) {
    const where = sn ? { sn: { contains: sn } } : {};

    const [total, list] = await Promise.all([
      this.prisma.final_check_mono_m55h.count({ where }),
      this.prisma.final_check_mono_m55h.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { datetime: 'asc' },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      list,
    };
  }
}

