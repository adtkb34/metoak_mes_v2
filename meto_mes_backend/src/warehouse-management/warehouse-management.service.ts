import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WarehouseManagementService {
  constructor(private readonly prisma: PrismaService) { }

  async getPackingInfo({
    start,
    end,
    packing_code,
    camera_sn_list,
  }: {
    start?: string;
    end?: string;
    packing_code?: string;
    camera_sn_list?: string[];
  }) {
    const where: any = {};

    if (start && end) {
      where.start_time = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    if (packing_code) {
      where.packing_code = {
        contains: packing_code,
      };
    }

    if (camera_sn_list?.length) {
      where.camera_sn = {
        in: camera_sn_list,
      };
    }

    const result = await this.prisma.mo_packing_info.groupBy({
      by: ['packing_code'],
      _count: { id: true },
      _min: {
        start_time: true,
        operator: true,
      },
      where,
    });

    return result.map((info) => ({
      packing_code: info.packing_code,
      operator: info._min.operator,
      start_time: info._min.start_time?.toISOString(),
      num: info._count.id,
    }));
  }

  getCameraSN(packing_code: string, start: Date, end: Date) {
    return this.prisma.mo_packing_info.findMany({
      where: {
        packing_code,
        start_time: { gte: start, lte: end },
      },
      select: {
        camera_sn: true,
        operator: true,
        start_time: true,
        return_repair_date: true,
      },
    });
  }

  async addCameraSN(packing_code: string, camera_sn: string, operator: string = 'manual') {
    const user = await this.prisma.mo_user_info.findUnique({
      where: { user_name: operator },
    });
    if (!user) throw new BadRequestException(`操作员 ${operator} 不存在`);

    return this.prisma.mo_packing_info.create({
      data: {
        packing_code,
        camera_sn,
        start_time: new Date(),
        station_number: 1,
        operator,
      },
    });
  }

  async deleteCameraSN(camera_sn: string) {
    const count = await this.prisma.mo_packing_info.count({
      where: { camera_sn },
    });
    if (count === 0) throw new NotFoundException(`找不到 SN: ${camera_sn}`);

    return this.prisma.mo_packing_info.deleteMany({
      where: { camera_sn },
    });
  }


  async deleteCameraSNs(cameraSNs: string[]) {
    if (!cameraSNs || cameraSNs.length === 0) {
      throw new BadRequestException('SN 列表不能为空');
    }

    const count = await this.prisma.mo_packing_info.count({
      where: { camera_sn: { in: cameraSNs } },
    });

    if (count === 0) {
      throw new NotFoundException('指定的 SN 不存在');
    }

    const result = await this.prisma.mo_packing_info.deleteMany({
      where: { camera_sn: { in: cameraSNs } },
    });

    return {
      deletedCount: result.count,
      message: `${result.count} 个 SN 已删除`,
    };
  }

  async updateCameraSN(old_sn: string, new_sn: string) {
    const exist = await this.prisma.mo_packing_info.findFirst({
      where: { camera_sn: old_sn },
    });
    if (!exist) throw new NotFoundException(`原 SN ${old_sn} 不存在`);

    return this.prisma.mo_packing_info.updateMany({
      where: { camera_sn: old_sn },
      data: { camera_sn: new_sn },
    });
  }

  async markReturnRepair(camera_sn_list: string[], repair_date?: string) {
    if (!camera_sn_list || camera_sn_list.length === 0) {
      throw new BadRequestException('SN 列表不能为空');
    }

    const time = repair_date ? new Date(repair_date) : new Date();

    const result = await this.prisma.mo_packing_info.updateMany({
      where: {
        camera_sn: {
          in: camera_sn_list,
        },
      },
      data: {
        return_repair_date: time,
      },
    });

    await this.prisma.mo_final_check.updateMany({
      where: {
        camera_sn: {
          in: camera_sn_list
        },
      },
      data: {
        return_repair_date: time
      },
    });

    return {
      updatedCount: result.count,
      message: `${result.count} 个 SN 已标记返厂`,
      repair_date: time,
    };
  }
}
