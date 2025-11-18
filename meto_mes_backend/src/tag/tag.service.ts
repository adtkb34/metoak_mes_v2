import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { BeamInfoDTO } from './beamInfo.dto';
import { ShellInfoDTO } from './shellInfo.dto';
import { ShellConfigDTO } from './shellConfig.dto';
import { MarkSerialDTO } from './markSerial.dto';

@Injectable()
export class TagService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllOrders() {
    const result = await this.prisma.mo_produce_order.findMany({
      select: {
        id: true,
        work_order_code: true,
        material_code: true,
        material_name: true,
        produce_count: true,
        completed_count: true,
      },
      orderBy: {
        work_order_code: 'asc',
      },
    });

    return result.filter((item) => !item.work_order_code?.includes('del'));
  }

  async getMaxSerialNumber(beamSnPrefix: string): Promise<number> {
    const result = await this.prisma.mo_beam_info.aggregate({
      _max: {
        serial_number: true,
      },
      where: {
        beam_sn: {
          contains: beamSnPrefix,
        },
      },
    });

    return result._max.serial_number ?? 0;
  }

  async getBeamMaterialCode(work_order_code: string) {
    const res = await this.prisma.mo_produce_order.findFirst({
      where: { work_order_code: work_order_code },
    });

    const material_code = res?.material_code;

    const result = await this.prisma.mo_beam_material_code.findFirst({
      select: {
        material_letter: true,
      },
      where: {
        material_code: material_code,
      },
    });
    return result;
  }

  async getBeamSN(
    work_order_code: string,
    label_type = 'beam',
    onlyUnused = false,
  ) {
    if (label_type === 'shell') {
      return this.prisma.mo_tag_info.findMany({
        select: {
          tag_sn: true,
          id: true,
          is_used: true,
        },
        where: {
          work_order_code: work_order_code,
          ...(onlyUnused ? { is_used: 0 } : {}),
        },
        orderBy: {
          create_time: 'asc',
        },
      });
    }

    const result = await this.prisma.mo_beam_info.findMany({
      select: {
        beam_sn: true,
        id: true,
        is_used: true,
      },
      where: {
        work_order_code: work_order_code,
        ...(onlyUnused ? { is_used: 0 } : {}),
      },
    });

    return result;
  }

  async getShellSN(work_order_code: string, onlyUnused = false) {
    const result = await this.prisma.mo_tag_info.findMany({
      select: {
        tag_sn: true,
        id: true,
        is_used: true,
      },
      where: {
        work_order_code,
        ...(onlyUnused ? { is_used: 0 } : {}),
      },
      orderBy: {
        create_time: 'asc',
      },
    });

    return result;
  }

  async insertSerialRange(dto: BeamInfoDTO) {
    const { total, produced_order_id, beam_sn_prefix } = dto;
    const res = await this.prisma.mo_produce_order.findFirst({
      where: { id: produced_order_id },
    });

    const material_code = res?.material_code;
    const work_order_code = res?.work_order_code;
    const material_letter = beam_sn_prefix[0];

    const existing = await this.prisma.mo_beam_material_code.findFirst({
      where: { material_code: material_code },
    });

    if (existing) {
      await this.prisma.mo_beam_material_code.updateMany({
        where: { material_code: material_code },
        data: {
          material_letter: material_letter,
        },
      });
    } else {
      await this.prisma.mo_beam_material_code.create({
        data: {
          material_code: material_code,
          material_letter: material_letter,
        },
      });
    }

    if (!this.prefixValidator(beam_sn_prefix)) {
      return {
        type: 'error',
        message: 'prefix error',
      };
    }

    const currentMax = await this.getMaxSerialNumber(beam_sn_prefix);

    const create_time = new Date();

    const data: Prisma.mo_beam_infoCreateManyInput[] = [];
    for (let index = 1; index <= total; index++) {
      let serial_number = currentMax + index;
      const beam_sn = `${beam_sn_prefix}${serial_number.toString().padStart(5, '0')}`;

      data.push({
        beam_sn,
        work_order_code,
        serial_number,
        create_time,
        material_code,
      });
    }

    try {
      const result = await this.prisma.mo_beam_info.createMany({
        data,
        skipDuplicates: true, // 防止重复
      });

      return {
        type: 'success',
        ...result,
        data,
      };
    } catch (e) {
      throw new Error(e);
    }
  }

  async getShellMaxSerialNumber(shellSnPrefix: string): Promise<number> {
    const result = await this.prisma.mo_tag_info.aggregate({
      _max: {
        serial_number: true,
      },
      where: {
        tag_sn: {
          startsWith: shellSnPrefix,
        },
      },
    });

    return result._max.serial_number ?? 0;
  }

  async insertShellSerialRange(dto: ShellInfoDTO) {
    const {
      total,
      produced_order_id,
      shell_sn_prefix,
      serial_prefix,
      front_section,
      operator,
    } = dto;
    let serialPrefixLength = 0;
    if (serial_prefix && typeof serial_prefix === 'string') {
      serialPrefixLength = serial_prefix.length;
    }
    if (!this.prefixValidator(shell_sn_prefix)) {
      return {
        type: 'error',
        message: 'prefix error',
      };
    }

    const currentMax = await this.getShellMaxSerialNumber(shell_sn_prefix);
    const create_time = new Date();
    const data: Prisma.mo_tag_infoCreateManyInput[] = [];

    for (let index = 1; index <= total; index++) {
      const serial_number = currentMax + index;
      const tag_sn = `${shell_sn_prefix}${serial_number
        .toString()
        .padStart(5 - serialPrefixLength, '0')}`;

      const res = await this.prisma.mo_produce_order.findFirst({
        where: { id: produced_order_id },
      });

      const material_code = res?.material_code;
      const work_order_code = res?.work_order_code;
      const record: Prisma.mo_tag_infoCreateManyInput = {
        tag_sn,
        work_order_code,
        serial_number,
        create_time,
        material_code,
      };

      if (typeof produced_order_id === 'number') {
        record.produce_order_id = produced_order_id;
      }

      if (front_section) {
        record.front_section = front_section;
      }

      if (operator) {
        record.operator = operator;
      }

      data.push(record);
    }

    try {
      const result = await this.prisma.mo_tag_info.createMany({
        data,
        skipDuplicates: true,
      });

      return {
        type: 'success',
        ...result,
        data,
      };
    } catch (e) {
      throw new Error(e);
    }
  }

  private prefixValidator(prefixStr: string): boolean {
    const regex = /^[A-Z0-9]+$/;
    return regex.test(prefixStr);
  }

  async getShellConfig(material_code: string, project_name?: string) {
    if (!material_code) {
      return null;
    }

    const record = await this.prisma.mo_tag_material_code.findFirst({
      where: {
        material_code,
        ...(project_name ? { project_name } : {}),
      },
      orderBy: {
        updated_time: 'desc',
      },
    });

    if (record) {
      return record;
    }

    if (project_name) {
      return this.prisma.mo_tag_material_code.findFirst({
        where: {
          material_code,
        },
        orderBy: {
          updated_time: 'desc',
        },
      });
    }

    return null;
  }

  async saveShellConfig(dto: ShellConfigDTO) {
    const {
      material_code,
      project_name,
      whole_machine_code,
      process_code,
      serial_prefix,
    } = dto;

    if (!material_code) {
      throw new Error('material_code is required');
    }

    let resolvedProjectName = project_name;

    if (!resolvedProjectName) {
      const order = await this.prisma.mo_produce_order.findFirst({
        where: {
          material_code,
        },
        select: {
          material_name: true,
        },
      });

      resolvedProjectName = order?.material_name ?? material_code;
    }

    const timestamp = new Date();

    return this.prisma.mo_tag_material_code.upsert({
      where: {
        project_name_material_code: {
          project_name: resolvedProjectName,
          material_code,
        },
      },
      update: {
        whole_machine_code: whole_machine_code ?? null,
        process_code: process_code ?? null,
        serial_prefix: serial_prefix ?? null,
        updated_time: timestamp,
      },
      create: {
        project_name: resolvedProjectName,
        material_code,
        whole_machine_code: whole_machine_code ?? null,
        process_code: process_code ?? null,
        serial_prefix: serial_prefix ?? null,
        created_time: timestamp,
        updated_time: timestamp,
      },
    });
  }

  async markSerialNumbersAsUsed(dto: MarkSerialDTO) {
    const { work_order_code, label_type, serial_numbers } = dto;

    if (!serial_numbers?.length || !work_order_code) {
      return { count: 0 };
    }

    if (label_type === 'shell') {
      return this.prisma.mo_tag_info.updateMany({
        where: {
          work_order_code,
          tag_sn: {
            in: serial_numbers,
          },
        },
        data: {
          is_used: 1,
        },
      });
    }

    return this.prisma.mo_beam_info.updateMany({
      where: {
        work_order_code,
        beam_sn: {
          in: serial_numbers,
        },
      },
      data: {
        is_used: 1,
      },
    });
  }
}
