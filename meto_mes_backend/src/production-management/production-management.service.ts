import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MoProduceOrder } from './produce';
import { CreateMoProduceOrderDto } from './create-order.dto';
import { UpdateMoProduceOrderDto } from './update-order.dto';
import { K3CloudService } from '../k3cloud/k3cloud.service';

@Injectable()
export class ProductionManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly k3cloudService: K3CloudService
  ) {}
  async getProduceOrders(): Promise<MoProduceOrder[]> {
    
    await this.k3cloudService.queryPrdMO()
    // mysql 驱动遇到非法日期会报错, 这里用 CAST 直接作为字符串处理
    const orders: MoProduceOrder[] = await this.prisma.$queryRawUnsafe(`
      SELECT 
        id, work_order_code, order_date, material_code, material_name, completed_count, model_type,
        produce_count, produce_unit, 
        CAST(planned_starttime AS CHAR) AS planned_starttime,
        CAST(planned_endtime AS CHAR) AS planned_endtime,
        flow_code,
        order_state,
        description
      FROM mo_produce_order
      WHERE order_state = 3 or order_state = 4
      ORDER BY order_date desc
    `);

    return orders;
  }

  async createProduceOrder(dto: CreateMoProduceOrderDto) {
    let work_order_code = dto.work_order_code;
    let suffix = 1; // 流水号从 1 开始

    // 检查 work_order_code 是否已存在
    let existing = await this.prisma.mo_produce_order.findFirst({
      where: { work_order_code },
    });

    // 如果 work_order_code 已存在，添加流水号
    while (existing) {
      work_order_code = `${dto.work_order_code}-${suffix}`;
      suffix += 1; // 流水号自增
      existing = await this.prisma.mo_produce_order.findFirst({
        where: { work_order_code },
      });
    }

    // 更新 dto 中的 work_order_code
    dto.work_order_code = work_order_code;


    return this.prisma.mo_produce_order.create({
      data: {
        ...dto
      }
    })
  }

  async updateProduceOrder(code: string, dto: UpdateMoProduceOrderDto) {
    const existing = await this.prisma.mo_produce_order.findFirst({
      where: { work_order_code: code }
    });

    if (!existing) {
      throw new Error('Order Code Not Exist');
    }

    return this.prisma.mo_produce_order.updateMany({
      where: { work_order_code: code },
      data: { ...dto }
    })
  }

  async deleteProduceOrder(work_order_code: string) {
    return this.prisma.mo_produce_order.updateMany({
      where: { work_order_code: work_order_code },
      data: { work_order_code: `del_${work_order_code}` }
    })
  }

  async getLatestProcessCodeByMaterial(
    materialCode: string,
  ): Promise<string | null> {
    const order = await this.prisma.mo_produce_order.findFirst({
      where: { material_code: materialCode },
      orderBy: [
        { order_date: 'desc' },
        { added_time: 'desc' },
        { id: 'desc' },
      ],
      select: { flow_code: true },
    });

    return order?.flow_code?.trim() || null;
  }
}
