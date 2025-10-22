import { Injectable, OnModuleInit } from '@nestjs/common';
import { startWith } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSpcConfigDto, UpdateSpcConfigDto } from './dto';
import { cleanUndefined } from 'src/utils/db';

@Injectable()
export class SpcService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) { }

  public readonly allowedSteps = [
    { "key": "020", "label": "标定", "tableName": "calibresult" },
    { "key": "000", "label": "脏污检测", "tableName": "mo_dirty_check" },
    { "key": "001", "label": "UV点胶", "tableName": "mo_uv_dispensing" },
    { "key": "002", "label": "自动调焦", "tableName": "mo_auto_adjust_st08" },
    { "key": "011", "label": "横梁外观检测", "tableName": "mo_beam_appearance_inspection" },
    { "key": "012", "label": "镭雕&检查", "tableName": "mo_laser_marking_inspection" },
    { "key": "013", "label": "横梁密封胶涂布", "tableName": "mo_uv_dispensing" },
    { "key": "014", "label": "CMOS外观检测", "tableName": "mo_cmos_appearance_inspection" },
    { "key": "015", "label": "撕膜清洁", "tableName": "mo_dirty_check" },
    { "key": "016", "label": "CMOS螺丝锁付", "tableName": "mo_screw_tightening_inspection" },
    { "key": "017", "label": "高温固化", "tableName": "mo_high_temp_curing_record" },
    { "key": "018", "label": "AA后综合检测", "tableName": "mo_aa_final_comprehensive_inspection" },
    { "key": "019", "label": "AA后涂布", "tableName": "mo_after_aa_coating_process_record" },

  ];

  // 字段列表（字段名与 label 配对，字段名需与数据库完全一致）
  public readonly allowedFields = [
    { key: 'LeftSharpness', label: '左图清晰度' },
    { key: 'RightSharpness', label: '右图清晰度' },
    { key: 'Simor_validPattern', label: 'Simor 图案有效性' },
    { key: 'Simor_mean_reprojection_error', label: 'Simor 平均重投影误差' },
    { key: 'Simor_mean_left_reprojection_error', label: 'Simor 左图平均误差' },
    { key: 'Simor_mean_right_reprojection_error', label: 'Simor 右图平均误差' },
    { key: 'Simor_max_left_reprojection_error', label: 'Simor 最大左误差' },
    { key: 'Simor_max_right_reprojection_error', label: 'Simor 最大右误差' },
    { key: 'Simor_amplify_ratio', label: 'Simor 放大倍率' },
    { key: 'Simor_left_trim', label: 'Simor 左裁剪宽度' },
    { key: 'Simor_right_trim', label: 'Simor 右裁剪宽度' },
    { key: 'Simor_fov_h', label: 'Simor 水平视角' },
    { key: 'Simor_fov_v', label: 'Simor 垂直视角' },
    { key: 'Simor_simor_calc_result', label: 'Simor 计算结果' },
    { key: 'ISP_validPattern', label: 'ISP 图案有效性' },
    { key: 'ISP_mean_reprojection_error', label: 'ISP 平均重投影误差' },
    { key: 'ISP_mean_left_reprojection_error', label: 'ISP 左图平均误差' },
    { key: 'ISP_mean_right_reprojection_error', label: 'ISP 右图平均误差' },
    { key: 'ISP_max_left_reprojection_error', label: 'ISP 最大左误差' },
    { key: 'ISP_max_right_reprojection_error', label: 'ISP 最大右误差' },
    { key: 'ISP_amplify_ratio', label: 'ISP 放大倍率' },
    { key: 'ISP_left_trim', label: 'ISP 左裁剪宽度' },
    { key: 'ISP_right_trim', label: 'ISP 右裁剪宽度' },
    { key: 'ISP_fov_h', label: 'ISP 水平视角' },
    { key: 'ISP_fov_v', label: 'ISP 垂直视角' },
    { key: 'ISP_simor_calc_result', label: 'ISP 计算结果' },
    { key: 'ISP_RectifyVerticalOffset', label: 'ISP 垂直校正偏移' },
    // { key: 'Station', label: '工位编号' },
  ];

  getAvailableSteps() {
    return this.allowedSteps;
  }


  async getAvailableFields(
    stepNo: string
  ) {
    const sql = `
      SELECT COLUMN_NAME, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = '${this.allowedSteps.filter(step => step.key === stepNo)[0].tableName}'
      ORDER BY ORDINAL_POSITION
    `

    const rows: { COLUMN_NAME: string; COLUMN_COMMENT: string }[] =
      await this.prisma.$queryRawUnsafe(sql)

    return rows.map(r => ({
      key: r.COLUMN_NAME,
      label: r.COLUMN_COMMENT || r.COLUMN_NAME
    }))
  }

  private async getCalibrationField(
    field: string,
    start: Date,
    end: Date,
    limit = 50
  ) {
    const validKeys = this.allowedFields.map(f => f.key);
    if (!validKeys.includes(field)) {
      throw new Error(`Unsupported field: ${field}`);
    }

    const results = await this.prisma.calibresult.findMany({
      where: {
        TimeStamp: {
          gte: start.toISOString(),
          lte: end.toISOString(),
        },
        [field]: { not: 0 },
        CameraSN: {
          startsWith: 'S315'
        },
      },
      select: {
        [field]: true,
        TimeStamp: true,
        CameraSN: true
      },
      orderBy: {
        TimeStamp: 'desc',
      },
      take: limit,
    });

    const cameraSNList = results.map(r => r.CameraSN).filter(Boolean);
    const calibrationMap = await this.prisma.mo_calibration.findMany({
      where: {
        camera_sn: {
          in: cameraSNList as string[],
        },
      },
      select: {
        camera_sn: true,
        error_code: true,
      },
    });

    const errorCodeMap = new Map<string, number>();
    calibrationMap.forEach(c => {
      if (c.camera_sn) errorCodeMap.set(c.camera_sn, c.error_code ?? -1);
    });

    const passed: any = [];
    const failed: any = [];

    for (const item of results) {
      const sn = item.CameraSN!;
      const error = errorCodeMap.get(sn);
      const itemWithErrorCode = {
        ...item,
        error_code: error
      }
      if (error === 0) {
        passed.push(itemWithErrorCode);
      } else {
        failed.push(itemWithErrorCode);
      }
    }

    return {
      passed,
      failed,
    };
  }

  async getEstimatedLimits(
    field: string,
    start: Date,
    end: Date,
    limit = 100
  ): Promise<{ usl: number, lsl: number, avg: number, std: number }> {
    const result = await this.getCalibrationField(field, start, end, limit);
    const passed = result.passed.map(row => Number(row[field as keyof typeof row])).filter(v => !isNaN(v));

    if (passed.length === 0) {
      throw new Error('No valid passed data found.');
    }

    const avg = passed.reduce((sum, val) => sum + val, 0) / passed.length;
    const variance = passed.reduce((sum, val) => sum + (val - avg) ** 2, 0) / passed.length;
    const std = Math.sqrt(variance);

    const k = 3; // 可调节：2 或 1.5 或别的
    const usl = +(avg + k * std).toFixed(3);
    const lsl = +(avg - k * std).toFixed(3);

    return {
      usl,
      lsl,
      avg: +avg.toFixed(3),
      std: +std.toFixed(3),
    };
  }

  async getFieldSeries(
    stepNo: string,
    field: string,
    start: Date,
    end: Date,
    limit = 50,
    status: 'passed' | 'failed' = 'passed'  // 默认只返回 error_code === 0
  ): Promise<any> {
    // const result = await this.getCalibrationField(field, start, end, limit);
    // const rows = result[status];

    
    // const res = rows.map(row => ({
    //   sn: row.CameraSN,
    //   time: new Date(row.TimeStamp),
    //   value: row[field as keyof typeof row],
    //   error_code: row.error_code
    // }));
    // return res;
    let tableName = this.allowedSteps.filter(step => step.key === stepNo)[0].tableName
      const sql = `
        SELECT ${tableName}.*, \`${field}\` AS val
        FROM \`${tableName}\`  left join mo_process_step_production_result ON mo_process_step_production_result.id = mo_process_step_production_result_id where mo_process_step_production_result.step_type_no = ${stepNo}
        ORDER BY ${tableName}.id desc
        LIMIT ${limit}
      `
      console.log(sql)
      const rows = await this.prisma.$queryRawUnsafe<any>(sql)
      console.log(rows);
      
      return rows.map(r => r)
  }

  /** 以下为模拟数据，用于本地测试可选保留 */
  private items = [
    {
      id: 'stationA',
      title: '工位 A',
      usl: 60,
      lsl: 40,
      data: Array.from({ length: 50 }, () => this.generateRandom(50, 5)),
    },
    {
      id: 'stationB',
      title: '工位 B',
      usl: 70,
      lsl: 30,
      data: Array.from({ length: 50 }, () => this.generateRandom(48, 6)),
    },
  ];

  async updateConfig(data: UpdateSpcConfigDto) {
    const res = await this.prisma.mo_spc_config.findFirst({
      where: {
        user_name: data.user_name,
        table_name: data.table_name,
        field_name: data.field_name
      },
    })
    if (!res) {
      return;
    }
    return await this.prisma.mo_spc_config.update({
      where: { id: res.id },
      data: {
        ...data,
        datetime: new Date(),
      },
    });
  }

  async getConfigs(userId?: string, tableName?: string, field?: string) {
    return this.prisma.mo_spc_config.findFirst({
      where: {
        user_name: userId,
        table_name: tableName,
        field_name: field
      },
      orderBy: { datetime: 'desc' },
    });
  }

  async setConfig(data: CreateSpcConfigDto) {
    // 先查是否存在同一 user_id、table_name、field_name 的记录
    const existing = await this.prisma.mo_spc_config.findFirst({
      where: {
        user_name: data.user_name,
        table_name: data.table_name,
        field_name: data.field_name,
      },
    });

    if (existing) {
      // 存在则更新
      return await this.prisma.mo_spc_config.update({
        where: { id: existing.id },
        data: {
          ...data,
          datetime: new Date(),
        },
      });
    } else {
      // 不存在则插入
      return await this.prisma.mo_spc_config.create({
        data: {
          ...data,
          datetime: new Date(),
        },
      });
    }
  }

  onModuleInit() {
    setInterval(() => {
      this.items.forEach(item => {
        const center = (item.usl + item.lsl) / 2;
        const delta = (item.usl - item.lsl) / 2;
        const newVal = this.generateRandom(center, delta);
        item.data.push(newVal);
        if (item.data.length > 200) item.data.shift();
      });
    }, 1000);
  }

  private generateRandom(mean: number, delta: number): number {
    return +(mean + Math.random() * delta * 2 - delta).toFixed(2);
  }

  findAll() {
    return this.items;
  }

  findOne(id: string) {
    return this.items.find(i => i.id === id);
  }
}