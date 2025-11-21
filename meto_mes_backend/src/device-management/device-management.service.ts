import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  startOfDay,
  startOfHour,
  startOfWeek,
  addHours,
  format,
} from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

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

function toUtcBucket(date: Date, interval: 'hour' | 'day' | 'week'): string {
  // 不用任何时区，直接用 UTC 各项取整
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');

  switch (interval) {
    case 'day':
      return `${year}-${month}-${day}`;
    case 'week': {
      const weekday = date.getUTCDay() || 7; // 以周一为开始
      const monday = new Date(
        Date.UTC(year, date.getUTCMonth(), date.getUTCDate() - (weekday - 1)),
      );
      return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, '0')}-${String(monday.getUTCDate()).padStart(2, '0')}`;
    }
    default:
      return `${year}-${month}-${day} ${hour}:00`;
  }
}

@Injectable()
export class DeviceManagementService {
  constructor(private readonly prisma: PrismaService) {}
  async getDeviceOptions() {
    const dbUrl = process.env.DATABASE_URL || '';
    const availableDevices = dbUrl.includes('11.11.11.13')
      ? [DeviceType.GUANGHAOJIE_AA, DeviceType.SHUNYU_AA, DeviceType.CALIB]
      : [DeviceType.AIWEISHI_AA, DeviceType.CALIB];

    return availableDevices.map((device) => ({
      label: device.name,
      value: device.code,
    }));
  }

  async getEfficiencyStatistics(params: EfficiencyStatisticsParams) {
    let rows: { time: Date | null }[] = [];
    const aaDevices = [
      DeviceType.SHUNYU_AA.code,
      DeviceType.AIWEISHI_AA.code,
    ] as string[];

    // ✅ 构造 UTC 边界，强制使用 UTC
    const startUtc = params.start
      ? new Date(
          Date.UTC(
            Number(params.start.slice(0, 4)),
            Number(params.start.slice(5, 7)) - 1,
            Number(params.start.slice(8, 10)),
            0,
            0,
            0,
          ),
        )
      : undefined;

    const endUtc = params.end
      ? new Date(
          Date.UTC(
            Number(params.end.slice(0, 4)),
            Number(params.end.slice(5, 7)) - 1,
            Number(params.end.slice(8, 10)),
            23,
            59,
            59,
            999,
          ),
        )
      : undefined;

    console.log('UTC 查询参数:', { startUtc, endUtc });

    // ✅ 查询不同设备
    if (params.deviceId === DeviceType.GUANGHAOJIE_AA.code) {
      const result = await this.prisma.mo_auto_adjust_info.findMany({
        where: {
          station_num: 7,
          operation_time: {
            ...(startUtc && { gte: startUtc }),
            ...(endUtc && { lte: endUtc }),
          },
        },
        select: { operation_time: true },
      });
      rows = result.map((r) => ({ time: r.operation_time }));
    } else if (aaDevices.includes(params.deviceId)) {
      const result = await this.prisma.mo_auto_adjust_info.findMany({
        where: {
          station_num: { not: 7 },
          add_time: {
            ...(startUtc && { gte: startUtc }),
            ...(endUtc && { lte: endUtc }),
          },
        },
        select: { add_time: true },
      });
      rows = result.map((r) => ({ time: r.add_time }));
    } else if (params.deviceId === DeviceType.CALIB.code) {
      const result = await this.prisma.mo_calibration.findMany({
        where: {
          start_time: {
            ...(startUtc && { gte: startUtc }),
            ...(endUtc && { lte: endUtc }),
          },
        },
        select: { start_time: true },
      });
      rows = result.map((r) => ({ time: r.start_time }));
    }

    const interval = (params.interval ?? 'hour') as 'hour' | 'day' | 'week';

    const grouped = new Map<string, number>();

    for (const row of rows) {
      if (!row.time) continue;
      const bucket = toUtcBucket(row.time, interval);
      grouped.set(bucket, (grouped.get(bucket) || 0) + 1);
    }

    const points = Array.from(grouped.entries())
      .map(([timestamp, quantity]) => ({ timestamp, quantity }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    console.log('✅ 真·UTC 统计结果:', points);
    return {
      deviceId: params.deviceId,
      start: params.start,
      end: params.end,
      interval,
      points,
    };
  }
}
