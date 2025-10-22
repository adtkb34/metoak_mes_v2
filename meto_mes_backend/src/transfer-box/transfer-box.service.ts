/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransferBoxDto } from './create-transfer-box.dto';
import { UpdateTransferBoxDto } from './update-transfer-box.dto';
import { stringify } from 'json-bigint';

@Injectable()
export class TransferBoxService {
  constructor(private prisma: PrismaService) {}

  private async generateBatchNumber(): Promise<string> {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prisma = this.prisma as any;
    const count = await prisma.transfer_box.count({
      where: { batch_number: { startsWith: datePart } },
    });
    const serial = (count + 1).toString().padStart(3, '0');
    return `${datePart}${serial}`;
  }

  async create(dto: CreateTransferBoxDto) {
    const batch_number = await this.generateBatchNumber();
    const prisma = this.prisma as any;
    await prisma.transfer_box.create({
      data: { ...dto, batch_number },
    });
  }

  async findAll() {
    const prisma = this.prisma as any;
    const result = await prisma.transfer_box.findMany({
      orderBy: { id: 'desc' },
    });

    // 使用 json-bigint 序列化
    return JSON.parse(stringify(result));
  }

  update(id: number, dto: UpdateTransferBoxDto) {
    const prisma = this.prisma as any;
    return prisma.transfer_box.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    const prisma = this.prisma as any;
    return prisma.transfer_box.delete({ where: { id } });
  }

  

  async findBatchNo(boxNos: String) {
    const prisma = this.prisma as any;
    const moment = require('moment');
    const datePart = moment().format('YYMMDD')

    // 生成三位数的流水号
    

    // 组合成完整的批次号
    
    const result = await prisma.transfer_box.findMany({
      where: {
        batch_number: {
            startsWith: datePart,
        },
        distinct: ['batch_number']
      },
    });
    let serialNumber = result.length() + 1; // 假设流水号从 1 开始
    const serialPart = serialNumber.toString().padStart(3, '0'); // 确保流水号是三位数
    const batchNumber = `${datePart}${serialPart}`;
    await prisma.transfer_box.create({
      where: {
        batch_number: {
            startsWith: datePart,
        },
        distinct: ['batch_number']
      },
    });
    return batchNumber
  }
}
