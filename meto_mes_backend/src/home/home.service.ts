import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);
  private tableCache: Map<string, any> = new Map();
  private readonly tablesToCache = ['mo_packing_info', 'mo_final_check', 'mo_oqc_info', 'mo_assemble_info', 'mo_calibration'];
  private hourlyStatsCache: Record<string, { data: number[]; updatedAt: number }> = {};

  constructor(private readonly prisma: PrismaService) { }

  async getProduceOrder() {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          m.work_order_code,
          m.order_date,
          m.material_code,
          m.material_name,
          m.produce_count,
          m.planned_endtime,
          m.order_state,
          v.complete_num
        FROM mo_produce_order m
        LEFT JOIN view_order_completecount v 
        ON m.work_order_code = v.work_order_code
        WHERE m.order_state <> 1 
          AND (m.planned_starttime IS NULL OR m.planned_starttime >= '2000-01-01')
        ORDER BY m.planned_endtime
      `;

      return result;
    } catch (error) {
      this.logger.error('查询生产订单失败', error);
      throw error;
    }
  }

  async getOutputHistory() {
    try {
      const result = await this.prisma.$queryRaw<
        { days: string; stage: string; num: bigint }[]
      >`
        SELECT days, stage, num
        FROM view_output_history
        WHERE days < CURDATE()
      `;

      const parsed = result.map((row) => ({
        ...row,
        num: row.num.toString(), // 转成字符串，防止 BigInt 序列化报错
      }));

      return parsed;
    } catch (error) {
      this.logger.error('获取 OutputHistory 失败', error);
      throw error;
    }
  }

  async getOutputToday(): Promise<{ stage: string; num: bigint }[]> {
    try {
      return await this.prisma.$queryRaw`
        SELECT stage, num
        FROM view_stage_today
      `;
    } catch (error) {
      this.logger.error('获取 OutputToday 失败', error);
      throw error;
    }
  }

  @Cron('0,30 * * * *') // 每半小时刷新
  async refreshAllProductInfo() {
    const now = new Date();

    for (const tableName of this.tablesToCache) {
      try {
        const result = await this.getHourlyStats(tableName, now);
        this.tableCache.set(tableName, result);
        this.logger.log(`Refreshed data for ${tableName}`);
      } catch (e) {
        this.logger.error(`Error refreshing ${tableName}:`, e);
      }
    }
  }

  async getHourlyStats(tableName: string, date: Date): Promise<number[]> {
    const cacheKey = `${tableName}:${date.toISOString().slice(0, 10)}`; // 例如 "mo_packing_info:2025-07-21"
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // 缓存命中并在 1 小时内
    const cached = this.hourlyStatsCache[cacheKey];
    if (cached && now - cached.updatedAt < oneHour) {
      return cached.data;
    }

    // 缓存未命中或过期，重新查询
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const rawData: { end_time: Date }[] = await this.prisma.$queryRawUnsafe(
      `SELECT end_time FROM \`${tableName}\`
       WHERE end_time >= ? AND end_time < ?`,
      startOfDay,
      endOfDay
    );

    const hourlyCounts = Array(24).fill(0);
    for (const row of rawData) {
      const hour = new Date(row.end_time).getHours();
      hourlyCounts[hour]++;
    }

    // 写入缓存
    this.hourlyStatsCache[cacheKey] = {
      data: hourlyCounts,
      updatedAt: now,
    };

    return hourlyCounts;
  }

  // 外部调用接口：返回缓存结果
  async getCachedProductInfo(tableName: string): Promise<any> {
    const todayKey = `${tableName}:${new Date().toISOString().slice(0, 10)}`;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    const cached = this.hourlyStatsCache[todayKey];
    if (cached && now - cached.updatedAt < oneHour) {
      return cached.data;
    }

    // 缓存为空或过期，主动刷新并返回
    try {
      const result = await this.getHourlyStats(tableName, new Date());
      this.logger.warn(`Table ${tableName} not in cache or expired, refreshed manually`);
      return result;
    } catch (e) {
      this.logger.error(`Failed to refresh cache for ${tableName}:`, e);
      return []; 
    }
  }
}
