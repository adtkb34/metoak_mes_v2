import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductOrigin } from 'src/common/enums/product-origin.enum';
import { ProcessStep } from './type';
import { UpdateStageDto } from './update-stage.dto';
import { CreateProcessDto } from './create-flow.dto';

@Injectable()
export class BasicInformationService {
  constructor(private readonly prisma: PrismaService) { }

  async getProcessManagement() {
    const result = await this.prisma.mo_workstage.findMany({
      select: {
        stage_code: true,
        stage_name: true,
        stage_desc: true,
        target_table: true,
        step_type_no: true,
      },
    });

    return result;
  }

  async deleteProcessSteps(stage_codes: string[]) {
    const dependentFlows = await this.prisma.mo_process_flow.findMany({
      where: {
        stage_code: {
          in: stage_codes
        }
      },
      select: {
        process_code: true
      }
    })

    if (dependentFlows.length > 0) {
      const codes = dependentFlows.map(d => d.process_code).join(', ');
      throw new Error(`以下工序被流程依赖, 无法删除: ${codes}`);
    }

    return await this.prisma.$transaction([
      this.prisma.mo_workstage.deleteMany({
        where: {
          stage_code: {
            in: stage_codes
          }
        }
      })
    ])
  }

  async addProcessStep({ stage_name, stage_desc, target_table }: ProcessStep) {
    // const existing = await this.prisma.mo_workstage.findFirst({
    //   where: {
    //     stage_code
    //   }
    // });

    // if (existing) {
    //   throw new BadRequestException('stage_code exist');
    // }
    const steps = await this.prisma.mo_workstage.findMany({
      select: {
        stage_code: true
      },
    });

    const maxStepNumber = Math.max(
      ...steps
        .map(item => {
          // 使用可选链操作符和默认值
          const stageCode = item.stage_code?.replace('Step ', '') || '';
          return parseInt(stageCode, 10);
        })
        .filter(num => !isNaN(num))
    );
    const stage_code = "Step " + (maxStepNumber + 1)
    
    const result = await this.prisma.mo_workstage.create({
      data: {
        stage_code,
        stage_name,
        stage_desc,
        target_table: target_table,
        add_time: new Date()
      }
    })

    if (result) {
      return {
        massage: 'success'
      }
    }
  }

  async updateProcessStep(stage_code: string, dto: UpdateStageDto) {
    const stage = await this.prisma.mo_workstage.findUnique({
      where: { stage_code }
    })

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    return this.prisma.mo_workstage.update({
      where: { stage_code },
      data: dto
    })
  }

  async deleteProcessFlow(process_code: string) {
    // 第一步：检查是否有工单依赖该工艺流程
    // const relatedOrders = await this.prisma.mo_produce_order.findMany({
    //   where: { flow_code: process_code },
    //   select: { work_order_code: true }
    // });

    // if (relatedOrders.length > 0) {
    //   const orders = relatedOrders.map(o => o.work_order_code).join(', ');
    //   throw new Error(`工艺流程被以下工单引用，无法删除：${orders}`);
    // }

    // 第二步：删除工艺流程
    return await this.prisma.mo_process_flow.deleteMany({
      where: { process_code }
    });
  }

  // 批量插入工艺流程
  async batchInsertProcessFlow(processes: CreateProcessDto[]) {
    let suffix = 1; // 流水号从 1 开始
    let process_code = processes[0].process_code;
    // 检查 process_code 是否已存在
    let existing = await this.prisma.mo_process_flow.findFirst({
      where: { process_code },
    });

    // 如果 process_code 已存在，添加流水号
    while (existing) {
      process_code = `${processes[0].process_code}-${suffix}`;
      suffix += 1; // 流水号自增
      existing = await this.prisma.mo_process_flow.findFirst({
        where: { process_code },
      });
    }
    return this.prisma.mo_process_flow.createMany({
      data: processes.map(item => ({
        ...item,
        process_code: process_code,
        add_time: new Date()
      })),
    });
  }

  async getProcessFlow(origin?: ProductOrigin) {
    const client = this.prisma.getClientByOrigin(origin);

    const result = await client.mo_process_flow.findMany({
      select: {
        process_code: true,
        process_name: true,
        stage_code: true,
        process_desc: true,
      },
    });

    return result;
  }
}
