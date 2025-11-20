import { Injectable } from '@nestjs/common';
import { format, startOfDay, startOfHour } from 'date-fns'; // ✅ 必须导入
import { PrismaService } from 'src/prisma/prisma.service';

interface EfficiencyStatisticsParams {
  deviceId: string;
  start?: string;
  end?: string;
  interval?: string;
}

export const DeviceType = {
  GUANGHAOJIE_AA: { code: '000', name: '光浩捷 AA 机' },
  SHUNYU_AA: { code: '001', name: '舜宇 AA 机' },
  AIWEISHI_AA: { code: '002', name: '艾薇视 AA 机' },
  CALIB: { code: '003', name: '标定台' },
} as const;

@Injectable()
export class DeviceManagementService {
  constructor(private readonly prisma: PrismaService) {}
  async getDeviceOptions() {
    const dbUrl = process.env.DATABASE_URL || '';
    const availableDevices = dbUrl.includes('11.11.11.15')
      ? [DeviceType.GUANGHAOJIE_AA, DeviceType.SHUNYU_AA, DeviceType.CALIB]
      : [DeviceType.AIWEISHI_AA, DeviceType.CALIB];

    return availableDevices.map((device) => ({
      label: device.name,
      value: device.code,
    }));
  }

  async getEfficiencyStatistics(params: EfficiencyStatisticsParams) {
    let rows: { time: Date | null }[] = [];

    if (params.deviceId === DeviceType.GUANGHAOJIE_AA.code) {
      const result = await this.prisma.mo_auto_adjust_info.findMany({
        where: {
          station_num: 7,
          operation_time: {
            ...(params.start && { gte: new Date(params.start) }),
            ...(params.end && { lte: new Date(params.end) }),
          },
        },
        select: { operation_time: true },
      });

      // ✅ 注意：map 在 await 之后执行
      rows = result.map((row) => ({
        time: row.operation_time, // 重命名字段
      }));
    } else if (
      params.deviceId in
      [DeviceType.SHUNYU_AA.code, DeviceType.AIWEISHI_AA.code]
    ) {
      const result = await this.prisma.mo_auto_adjust_st08.findMany({
        where: {
          add_time: {
            ...(params.start && { gte: new Date(params.start) }),
            ...(params.end && { lte: new Date(params.end) }),
          },
        },
        select: { add_time: true },
      });

      // ✅ 注意：map 在 await 之后执行
      rows = result.map((row) => ({
        time: row.add_time, // 重命名字段
      }));
    } else if (params.deviceId === DeviceType.CALIB.code) {
      const result = await this.prisma.mo_calibration.findMany({
        where: {
          start_time: {
            ...(params.start && { gte: new Date(params.start) }),
            ...(params.end && { lte: new Date(params.end) }),
          },
        },
        select: { start_time: true },
      });

      // ✅ 注意：map 在 await 之后执行
      rows = result.map((row) => ({
        time: row.start_time, // 重命名字段
      }));
    }

    const interval = params.interval || 'hour';
    const grouped = new Map<string, number>();

    for (const row of rows) {
      if (!row.time) continue; // ⛔️ 跳过 nulls
      const opTime = new Date(row.time); // ✅ 用重命名后的字段
      let bucket = '';

      switch (interval) {
        case 'day':
          bucket = format(startOfDay(opTime), 'yyyy-MM-dd');
          break;
        case 'week':
          const weekStart = new Date(opTime);
          weekStart.setDate(opTime.getDate() - opTime.getDay());
          bucket = format(weekStart, 'yyyy-MM-dd');
          break;
        default:
          bucket = format(startOfHour(opTime), 'yyyy-MM-dd HH:00');
          break;
      }

      grouped.set(bucket, (grouped.get(bucket) || 0) + 1);
    }

    // 3️⃣ 转成数组并按时间排序
    const points = Array.from(grouped.entries())
      .map(([timestamp, quantity]) => ({ timestamp, quantity }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return {
      deviceId: params.deviceId,
      start: params.start,
      end: params.end,
      interval,
      points,
    };
  }
}
