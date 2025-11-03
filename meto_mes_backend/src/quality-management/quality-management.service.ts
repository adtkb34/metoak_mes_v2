import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SpcService } from '../spc/spc.service';
import { ConfigService } from '@nestjs/config';
import {
  mapErrCodeDesc2,
  mapErrCodeDescAA,
  mapErrCodeDescMA,
  mapErrCodeFQC,
} from './errorCode';
import { updateNgReason4Aiweishi } from '../common/utils/error-reason.util';

@Injectable()
export class QualityManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spcService: SpcService,
    private readonly configService: ConfigService,
  ) {}

  async calcFirstPassYield(startDate: string, endDate: string) {
    const [gte, lte] = [new Date(startDate), new Date(endDate)];
    const result = {
      adjustFocus: await this.calcAdjustFocus(startDate, endDate),
      autoAdjust: await this.calcAutoAdjust(gte, lte),
      calibration: await this.calcCalibration(gte, lte),
      fqc: await this.calcFinalCheck(gte, lte, 'FQC'),
      oqc: await this.calcFinalCheck(gte, lte, 'OQC'),
    };

    return result;
  }

  private async calcAdjustFocus(start: string, end: string) {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `
          SELECT camera_sn, SUM(error_code) AS error_code
          FROM (
            SELECT camera_sn, error_code, ROW_NUMBER() OVER (PARTITION BY camera_sn) AS rownum
            FROM mo_adjust_focus
            WHERE operator <> 'AA' AND DATE(start_time) BETWEEN ? AND ?
          ) m
          WHERE rownum <= 2
          GROUP BY camera_sn
        `,
      start,
      end,
    );

    const qualifiedRows = await this.prisma.$queryRawUnsafe<any[]>(
      `
          SELECT camera_sn, SUM(error_code) AS error_code
          FROM (
            SELECT camera_sn, error_code, ROW_NUMBER() OVER (PARTITION BY camera_sn) AS rownum
            FROM mo_adjust_focus
            WHERE operator <> 'AA' AND DATE(start_time) BETWEEN ? AND ?
            ORDER BY end_time DESC
          ) m
          WHERE rownum <= 2
          GROUP BY camera_sn
        `,
      start,
      end,
    );

    const total = rows.length;
    const onePass = rows.filter((r) => r.error_code == 0).length; // 一次通过
    const qualified = qualifiedRows.length;
    return { total, onePass, qualified };
  }

  private async calcAutoAdjust(gte: Date, lte: Date) {
    const rows = await this.prisma.mo_auto_adjust_info.findMany({
      where: {
        station_num: 7,
        operation_time: {
          gte,
          lte,
        },
      },
      distinct: ['beam_sn'],
      select: { operation_result: true },
    });

    const qualifiedRows = await this.prisma.mo_auto_adjust_info.findMany({
      where: {
        station_num: 7,
        operation_time: {
          gte,
          lte,
        },
        operation_result: 1,
      },
      distinct: ['beam_sn'],
      select: { operation_result: true },
      orderBy: { operation_time: 'desc' },
    });

    const total = rows.length;
    const onePass = rows.filter((r) => r.operation_result === 1).length;
    const qualified = qualifiedRows.length;
    return { total, onePass, qualified };
  }

  private async calcCalibration(gte: Date, lte: Date) {
    const rows = await this.prisma.mo_calibration.findMany({
      where: {
        start_time: {
          gte,
          lte,
        },
      },
      distinct: ['camera_sn'],
      select: { error_code: true },
    });
    const qualifiedRows = await this.prisma.mo_calibration.findMany({
      where: {
        start_time: {
          gte,
          lte,
        },
        error_code: 0,
      },
      distinct: ['camera_sn'],
      select: { error_code: true },
      orderBy: { end_time: 'desc' },
    });

    const total = rows.length;
    const onePass = rows.filter((r) => r.error_code === 0).length;
    const qualified = qualifiedRows.length;
    return { total, onePass, qualified };
  }

  private async calcFinalCheck(gte: Date, lte: Date, type: 'FQC' | 'OQC') {
    const rows = await this.prisma.mo_final_result.findMany({
      where: {
        check_type: type,
        check_time: {
          gte,
          lte,
        },
      },
      distinct: ['camera_sn'],
      select: { check_result: true },
    });

    const qualifiedRows = await this.prisma.mo_final_result.findMany({
      where: {
        check_type: type,
        check_time: {
          gte,
          lte,
        },
        check_result: true,
      },
      distinct: ['camera_sn'],
      orderBy: { check_time: 'asc' },
    });

    const total = rows.length;
    const onePass = rows.filter((r) => r.check_result === true).length;
    const qualified = qualifiedRows.length;
    return { total, onePass, qualified };
  }

  async findErrorsInRange(startDate: Date, endDate: Date) {
    const adjustRow = await this.prisma.mo_adjust_focus.findMany({
      where: {
        operator: { not: 'AA' },
        start_time: { gte: startDate, lte: endDate },
        error_code: { not: 0 },
      },
      select: {
        camera_sn: true,
        error_code: true,
        end_time: true,
      },
      orderBy: { id: 'desc' },
    });

    const autoRow = await this.prisma.mo_auto_adjust_info.findMany({
      where: {
        station_num: 7,
        add_time: { gte: startDate, lte: endDate },
        error_code: { not: 0 },
      },
      select: {
        beam_sn: true,
        error_code: true,
        add_time: true,
      },
      orderBy: { id: 'desc' },
    });

    const calibrateRaw = await this.prisma.mo_calibration.findMany({
      where: {
        start_time: { gte: startDate, lte: endDate },
        error_code: { not: 0 },
      },
      select: {
        camera_sn: true,
        error_code: true,
        end_time: true,
      },
      orderBy: { id: 'desc' },
    });

    const fqcRow = await this.prisma.mo_final_result.findMany({
      where: {
        check_type: 'FQC',
        check_time: { gte: startDate, lte: endDate },
        error_code: { not: 0 },
      },
      select: {
        camera_sn: true,
        error_code: true,
        return_repair_date: true,
      },
      orderBy: { id: 'desc' },
    });

    // const oqcRaw = await this.prisma.mo_final_result.findMany({
    //   where: {
    //     check_type: 'OQC',
    //     check_time: { gte: startDate, lte: endDate },
    //     error_code: { not: 0 },
    //   },
    //   select: {
    //     error_code: true,
    //     return_repair_date: true
    //   },
    //   orderBy: { id: 'desc' },
    // });

    return {
      adjust: adjustRow.map((item) => {
        return {
          ...item,
          description:
            mapErrCodeDescMA[item.error_code ?? -1] ?? item.error_code,
        };
      }),
      autoAdjust: autoRow.map((item) => {
        return {
          ...item,
          description:
            mapErrCodeDescAA[item.error_code ?? -1] ?? item.error_code,
        };
      }),
      calibrate: calibrateRaw.map((item) => {
        return {
          ...item,
          description:
            mapErrCodeDesc2[item.error_code ?? -1] ?? item.error_code,
        };
      }),
      fqc: fqcRow.map((item) => {
        return {
          ...item,
          description: mapErrCodeFQC[item.error_code ?? -1] ?? item.error_code,
        };
      }),
      // oqcRaw,
    };
  }

  async getMeasureDistanceData(
    start: string,
    end: string,
    distance: string,
    precisions: number[],
  ) {
    interface Row {
      date: string;
      total_count: bigint | number;
      valid_count: bigint | number;
    }

    interface DataItem {
      date: string;
      count: number;
      percent: number;
    }

    const result: Record<number, DataItem[]> = {};

    for (const precision of precisions) {
      const query = `
      SELECT DATE(timestamp) as date,
             COUNT(*) as total_count,
             SUM(CASE WHEN ABS(distance_measured - distance_truth) / distance_truth * 100 < ? THEN 1 ELSE 0 END) as valid_count
      FROM dist_measuring_check
      WHERE timestamp BETWEEN ? AND ? AND distance_truth = ?
      GROUP BY DATE(timestamp)
      ORDER BY DATE(timestamp)
    `;

      const rows = await this.prisma.$queryRawUnsafe<Row[]>(
        query,
        precision,
        start,
        end,
        distance,
      );

      result[precision] = rows.map((row) => {
        const totalCount =
          typeof row.total_count === 'bigint'
            ? Number(row.total_count)
            : row.total_count;
        const validCount =
          typeof row.valid_count === 'bigint'
            ? Number(row.valid_count)
            : row.valid_count;

        return {
          date: row.date.toString().slice(0, 10),
          count: totalCount,
          percent:
            totalCount === 0
              ? 0
              : Number(((validCount / totalCount) * 100).toFixed(2)),
        };
      });
    }
    const datesSet = new Set<string>();
    Object.values(result).forEach((arr) => {
      arr.forEach((item) => {
        datesSet.add(item.date);
      });
    });
    const dates = Array.from(datesSet).sort();

    const series = precisions.map((p) => ({
      name: p.toString(),
      data: dates.map((d) => {
        const found = result[p].find((r) => r.date === d);
        return found ? found.percent : 0;
      }),
    }));

    const counts = dates.map((d) => {
      let sum = 0;
      precisions.forEach((p) => {
        const found = result[p].find((r) => r.date === d);
        if (found) sum = found.count;
      });
      return sum;
    });

    return { dates, series, counts };
  }

  async getAllMeasureDistanceRawData(start: string, end: string) {
    const query = `
    SELECT *
    FROM dist_measuring_check
    WHERE timestamp BETWEEN ? AND ?
    ORDER BY timestamp
  `;
    return await this.prisma.$queryRawUnsafe<any[]>(query, start, end);
  }

  async getStereoCalibration(params: {
    startTime?: string;
    endTime?: string;
    cameraSN?: string;
    page?: number; // 可以 undefined
    pageSize?: number; // 可以 undefined
  }) {
    let { startTime, endTime, cameraSN, page, pageSize } = params;

    const where = {
      ...(cameraSN ? { CameraSN: cameraSN } : {}),
      ...(startTime || endTime
        ? {
            TimeStamp: {
              ...(startTime ? { gte: startTime } : {}),
              ...(endTime ? { lte: endTime } : {}),
            },
          }
        : {}),
    };

    const defaultPageSize = 20;
    pageSize = pageSize || defaultPageSize;

    // 如果 page 没传 → 全量
    const data = await this.prisma.calibresult.findMany({
      where,
      ...(page
        ? {
            skip: (page - 1) * pageSize,
            take: pageSize,
          }
        : {}),
    });

    const sqlColumns = `
    SELECT COLUMN_NAME, COLUMN_COMMENT
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'calibresult'
    ORDER BY ORDINAL_POSITION
  `;
    const columns: { COLUMN_NAME: string; COLUMN_COMMENT: string }[] =
      await this.prisma.$queryRawUnsafe(sqlColumns);

    const total = await this.prisma.calibresult.count({ where });

    return {
      total: total,
      columns,
      rows: JSON.parse(
        JSON.stringify(data, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        ),
      ),
    };
  }

  async getTableData(params: {
    stepNo: string;
    startTime?: string;
    endTime?: string;
    cameraSN?: string;
    pageNumber?: number | null;
    material_code?: string;
  }) {
    const { stepNo, startTime, endTime, cameraSN, pageNumber, material_code } =
      params;

    const tableName = this.spcService.allowedSteps.filter(
      (step) => step.key === stepNo,
    )[0].tableName;
    const mapFieldComment = await this.getFieldComment(tableName);
    const keyCandidates = this.resolveGroupingCandidates(mapFieldComment);
    const snExpression = this.buildProductSnExpression(
      tableName,
      mapFieldComment,
    );
    const result = await this.getResult(
      tableName,
      stepNo,
      startTime,
      endTime,
      cameraSN,
      pageNumber,
      keyCandidates,
      material_code,
      snExpression,
    );

    let newRes = await this.mergeRows(
      result.rows,
      tableName,
      mapFieldComment,
      keyCandidates,
    );
    // console.log(newRes)

    for (const o of newRes.data) {
      if (o.error_code != 0) {
        o.ng_reason = await updateNgReason4Aiweishi(
          this.configService,
          stepNo,
          o.ng_reason,
        );
      }
    }

    newRes.columns.sort((a, b) => {
      const labelA = a.label?.split('-')[1] ?? '';
      const labelB = b.label?.split('-')[1] ?? '';
      if (labelA < labelB) {
        return -1;
      }
      if (labelA > labelB) {
        return 1;
      }
      return 0;
    });
    if (!cameraSN) {
      newRes.data = newRes.data.slice(1, -1);
    }
    return {
      columns: newRes.columns,
      rows: newRes.data,
      total: result.total,
      errorCount: result.errorCount,
    };
  }

  async getFieldComment(tableName: string) {
    const sqlColumns = `
          SELECT COLUMN_NAME, COLUMN_COMMENT
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}'
          ORDER BY ORDINAL_POSITION
        `;
    const records: { COLUMN_NAME: string; COLUMN_COMMENT: string }[] =
      await this.prisma.$queryRawUnsafe(sqlColumns);

    return records.reduce(
      (acc, { COLUMN_NAME, COLUMN_COMMENT }) => {
        acc[COLUMN_NAME] = COLUMN_COMMENT;
        return acc;
      },
      {} as { [key: string]: string },
    );
  }

  private resolveGroupingCandidates(mapFieldComment: {
    [key: string]: string;
  }): string[] {
    const candidates: string[] = [];
    if (
      Object.prototype.hasOwnProperty.call(
        mapFieldComment,
        'mo_process_step_production_result_id',
      )
    ) {
      candidates.push('mo_process_step_production_result_id');
    }
    if (Object.prototype.hasOwnProperty.call(mapFieldComment, 'taskid')) {
      candidates.push('taskid');
    }
    if (Object.prototype.hasOwnProperty.call(mapFieldComment, 'id')) {
      candidates.push('id');
    }
    return candidates;
  }

  private buildUniqueKeyExpression(
    tableName: string,
    keyCandidates: string[],
  ): string {
    const qualifiedColumns = keyCandidates.map(
      (column) => `\`${tableName}\`.${column}`,
    );
    if (qualifiedColumns.length === 0) {
      return `\`${tableName}\`.id`;
    }
    if (qualifiedColumns.length === 1) {
      return qualifiedColumns[0];
    }
    return `COALESCE(${qualifiedColumns.join(', ')})`;
  }

  private buildProductSnExpression(
    tableName: string,
    mapFieldComment: { [key: string]: string },
  ): string {
    const possibleColumns = [
      'product_sn',
      'beam_sn',
      'camera_sn',
      'sn',
      'tag_sn',
    ];
    const qualified = possibleColumns
      .filter((column) =>
        Object.prototype.hasOwnProperty.call(mapFieldComment, column),
      )
      .map((column) => `\`${tableName}\`.${column}`);
    qualified.push('mo_process_step_production_result.product_sn');
    const uniqueQualified = Array.from(new Set(qualified));
    if (uniqueQualified.length === 1) {
      return uniqueQualified[0];
    }
    return `COALESCE(${uniqueQualified.join(', ')})`;
  }

  async getResult(
    tableName: string,
    stepNo: string,
    startTime?: string,
    endTime?: string,
    cameraSN?: string,
    pageNumber?: number | null,
    keyCandidates: string[] = [],
    material_code?: string,
    snExpression?: string,
  ) {
    const tableIdentifier = `\`${tableName}\``;
    const uniqueKeyExpr = this.buildUniqueKeyExpression(
      tableName,
      keyCandidates,
    );
    const sanitizedStepNo = stepNo.replace(/'/g, "''");
    const sanitizedStart = startTime
      ? startTime.replace(/'/g, "''")
      : undefined;
    const sanitizedEnd = endTime ? endTime.replace(/'/g, "''") : undefined;
    const sanitizedCamera = cameraSN ? cameraSN.replace(/'/g, "''") : undefined;
    const sanitizedMaterial = material_code
      ? material_code.replace(/'/g, "''")
      : undefined;
    const productSnExpr =
      snExpression ?? 'mo_process_step_production_result.product_sn';

    const conditions: string[] = [];
    if (sanitizedStart)
      conditions.push(
        `mo_process_step_production_result.add_time >= '${sanitizedStart}'`,
      );
    if (sanitizedEnd)
      conditions.push(
        `mo_process_step_production_result.add_time <= '${sanitizedEnd}'`,
      );
    if (sanitizedCamera)
      conditions.push(`(${productSnExpr}) = '${sanitizedCamera}'`);
    if (sanitizedMaterial) {
      const materialFilter = `(
        EXISTS (
          SELECT 1
          FROM mo_beam_info
            INNER JOIN mo_produce_order
              ON mo_produce_order.work_order_code = mo_beam_info.work_order_code
          WHERE mo_beam_info.beam_sn = ${productSnExpr}
            AND mo_produce_order.material_code = '${sanitizedMaterial}'
        )
        OR EXISTS (
          SELECT 1
          FROM mo_tag_info
            INNER JOIN mo_produce_order
              ON mo_produce_order.work_order_code = mo_tag_info.work_order_code
          WHERE mo_tag_info.tag_sn = ${productSnExpr}
            AND mo_produce_order.material_code = '${sanitizedMaterial}'
        )
      )`;
      conditions.push(materialFilter);
    }

    const fromClause = `FROM ${tableIdentifier}
      LEFT JOIN mo_process_step_production_result
        ON mo_process_step_production_result.id = ${tableIdentifier}.mo_process_step_production_result_id`;

    const whereParts = [
      `mo_process_step_production_result.step_type_no = '${sanitizedStepNo}'`,
      ...conditions,
    ];
    const whereClause =
      whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const sqlCount = `SELECT COUNT(DISTINCT ${uniqueKeyExpr}) as total ${fromClause} ${whereClause}`;
    const errorWhereParts = [
      ...whereParts,
      `${tableIdentifier}.error_code != 0`,
    ];
    const sqlErrorCount = `SELECT COUNT(DISTINCT ${uniqueKeyExpr}) as errorCount ${fromClause} ${errorWhereParts.length > 0 ? 'WHERE ' + errorWhereParts.join(' AND ') : ''}`;

    let sqlData = `SELECT * ${fromClause} ${whereClause} order by ${tableIdentifier}.id desc`;
    if (pageNumber) sqlData += `  limit ${100 * (pageNumber - 1)}, 100`;

    const [{ total }] =
      await this.prisma.$queryRawUnsafe<{ total: bigint }[]>(sqlCount);
    const [{ errorCount }] =
      await this.prisma.$queryRawUnsafe<{ errorCount: bigint }[]>(
        sqlErrorCount,
      );
    const rows: any[] = await this.prisma.$queryRawUnsafe(sqlData);

    return {
      rows,
      total,
      errorCount,
    };
  }

  async mergeRows(rows, tableName, mapFieldComment, keyCandidates: string[]) {
    type DictType = { [key: string]: any };
    let mergeRows: DictType[] = [];
    type FieldComment = {
      label: string | undefined;
      isShow: number;
    };

    type NewMapFieldComment = {
      [key: string]: FieldComment;
    };
    let newMapFieldComment: NewMapFieldComment = {};
    const computeGroupKey = (item: Record<string, any>, index: number) => {
      for (const column of keyCandidates) {
        if (Object.prototype.hasOwnProperty.call(item, column)) {
          const value = item[column];
          if (value !== null && value !== undefined) {
            return String(value);
          }
        }
      }
      if (
        Object.prototype.hasOwnProperty.call(item, 'id') &&
        item['id'] !== null &&
        item['id'] !== undefined
      ) {
        return String(item['id']);
      }
      return `row_${index}`;
    };
    type GroupedList = {
      [key: string]: Array<Record<string, any>>;
    };
    const groupedList: GroupedList = rows.reduce(
      (acc: GroupedList, item: Record<string, any>, index: number) => {
        const key = computeGroupKey(item, index);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      },
      {} as GroupedList,
    );

    const configs = await this.prisma.table_config.findMany({
      where: {
        table_name: tableName,
      },
      select: {
        table_field: true,
        position: true,
        stage: true,
      },
    });

    const configDict = configs.reduce(
      (acc, config) => {
        acc[config.table_field] = {
          position: config.position,
          stage: config.stage,
        };
        return acc;
      },
      {} as { [key: string]: { position; stage } },
    );
    Object.entries(groupedList).forEach(([key, values]) => {
      let dict = {};
      values.forEach((val, index) => {
        Object.entries(val).forEach(([key2, val2]) => {
          let newKey = key2;
          if (key2 in mapFieldComment) {
            let keyComment = mapFieldComment[key2];
            let prefix = '';
            if (key2 in configDict) {
              let record = 0;
              if (
                val.stage !== undefined &&
                val.stage !== null &&
                val.stage != '-1'
              ) {
                prefix = `-${val.stage}`;
                record = 1;
              }
              if (
                val.position !== undefined &&
                val.position !== null &&
                val.position != -1
              ) {
                prefix = `${val.position}` + prefix;
                record = 1;
              }
              if (record) {
                newKey = `${prefix}-${newKey}`;
                keyComment = `${prefix}-${keyComment}`;
              }
            }
            if (
              (key2 in configDict && prefix !== '') ||
              !(key2 in configDict)
            ) {
              if (!(newKey in newMapFieldComment)) {
                newMapFieldComment[newKey] = {
                  label: keyComment,
                  isShow: 0,
                };
              }
              if (!(newKey in dict) && val2 !== '' && val2 !== null) {
                dict[newKey] =
                  val2 != -6259853400000000000 ? `${val2}` : '异常值';
                newMapFieldComment[newKey]['isShow'] = 1;
              }
            }
          }
        });
      });

      mergeRows.push(dict);
    });
    return {
      data: mergeRows,
      columns: Object.entries(newMapFieldComment).map(
        ([prop, { label, isShow }]) => ({
          prop,
          label,
          isShow,
        }),
      ),
    };
  }

  async getErrorCodes(params: {
    material_code?: string;
    table?: string;
    stepNo: string;
    startTime?: string;
    endTime?: string;
    cameraSN?: string;
  }) {
    const { stepNo, startTime, endTime, cameraSN, table, material_code } =
      params;

    let tableName = 'mo_process_step_production_result';
    let sqlList: string[] = [
      `
      SELECT mo_process_step_production_result.error_code, COUNT(*) AS count
      FROM  mo_process_step_production_result
        INNER JOIN mo_beam_info 
          ON mo_beam_info.beam_sn = mo_process_step_production_result.product_sn
        INNER JOIN mo_produce_order 
          ON mo_produce_order.work_order_code = mo_beam_info.work_order_code
      WHERE mo_process_step_production_result.step_type_no = '${stepNo}'
      AND mo_produce_order.material_code = '${material_code}'
      `,
      `
      SELECT mo_process_step_production_result.error_code, COUNT(*) AS count
      FROM  mo_process_step_production_result
        INNER JOIN mo_tag_info 
          ON mo_tag_info.tag_sn = mo_process_step_production_result.product_sn
        INNER JOIN mo_produce_order 
          ON mo_produce_order.work_order_code = mo_tag_info.work_order_code
      WHERE mo_process_step_production_result.step_type_no = '${stepNo}'
      AND mo_produce_order.material_code = '${material_code}'
      `,
    ];

    // 动态条件
    const conditions: string[] = [];
    if (startTime)
      conditions.push(`\`${tableName}\`.start_time >= '${startTime}'`);
    if (endTime) conditions.push(`\`${tableName}\`.start_time <= '${endTime}'`);
    if (cameraSN) conditions.push(`\`${tableName}\`.beam_sn = '${cameraSN}'`);

    // 拼接 WHERE/AND + GROUP BY
    sqlList = sqlList.map((sql) => {
      if (conditions.length > 0) {
        if (sql.toUpperCase().includes('WHERE')) {
          sql += ' AND ' + conditions.join(' AND ');
        } else {
          sql += ' WHERE ' + conditions.join(' AND ');
        }
      }
      sql += ` GROUP BY \`${tableName}\`.error_code ORDER BY count DESC`;
      return sql;
    });

    // 并行执行 SQL
    const allRows: any = await Promise.all(
      sqlList.map((sql) => {
        console.log(sql);
        return this.prisma.$queryRawUnsafe(sql);
      }),
    );

    // 把二维数组拍平
    const rows = allRows.flat();

    // 总数
    const total = rows.reduce((sum, r) => sum + Number(r.count), 0);

    // 计算百分比
    const stats = rows.map((r) => {
      const count = Number(r.count);
      return {
        error_code: r.error_code !== null ? r.error_code.toString() : 'null',
        count,
        percent: total === 0 ? '0%' : ((count / total) * 100).toFixed(1) + '%',
      };
    });

    return {
      totalGroups: total,
      stats,
    };
  }

  async getErrorCodesV2(params: {
    material_code?: string;
    table?: string;
    stepNo: string;
    startTime?: string;
    endTime?: string;
    cameraSN?: string;
  }) {
    const { stepNo, startTime, endTime, cameraSN, table, material_code } =
      params;
    const sanitizedStepNo = stepNo.replace(/'/g, "''");
    const sanitizedMaterial = material_code
      ? material_code.replace(/'/g, "''")
      : undefined;
    let tableName = 'mo_process_step_production_result';
    let sqlList: string[] = [
      `
      SELECT mo_process_step_production_result.error_code, mo_process_step_production_result.ng_reason
      FROM  mo_process_step_production_result
        INNER JOIN mo_beam_info
          ON mo_beam_info.beam_sn = mo_process_step_production_result.product_sn
        INNER JOIN mo_produce_order
          ON mo_produce_order.work_order_code = mo_beam_info.work_order_code
      WHERE mo_process_step_production_result.step_type_no = '${sanitizedStepNo}'
      ${sanitizedMaterial ? `AND mo_produce_order.material_code = '${sanitizedMaterial}'` : ''}
      `,
      `
      SELECT mo_process_step_production_result.error_code, mo_process_step_production_result.ng_reason
      FROM  mo_process_step_production_result
        INNER JOIN mo_tag_info
          ON mo_tag_info.tag_sn = mo_process_step_production_result.product_sn
        INNER JOIN mo_produce_order
          ON mo_produce_order.work_order_code = mo_tag_info.work_order_code
      WHERE mo_process_step_production_result.step_type_no = '${sanitizedStepNo}'
      ${sanitizedMaterial ? `AND mo_produce_order.material_code = '${sanitizedMaterial}'` : ''}
      `,
    ];

    // 动态条件
    const conditions: string[] = [];
    if (startTime)
      conditions.push(`\`${tableName}\`.start_time >= '${startTime}'`);
    if (endTime) conditions.push(`\`${tableName}\`.start_time <= '${endTime}'`);
    if (cameraSN) conditions.push(`\`${tableName}\`.beam_sn = '${cameraSN}'`);

    // 拼接 WHERE/AND + GROUP BY
    sqlList = sqlList.map((sql) => {
      if (conditions.length > 0) {
        if (sql.toUpperCase().includes('WHERE')) {
          sql += ' AND ' + conditions.join(' AND ');
        } else {
          sql += ' WHERE ' + conditions.join(' AND ');
        }
      }
      // sql += ` GROUP BY \`${tableName}\`.error_code ORDER BY count DESC`;
      return sql;
    });

    // 并行执行 SQL
    const allRows: any = await Promise.all(
      sqlList.map((sql) => {
        console.log(sql);
        return this.prisma.$queryRawUnsafe(sql);
      }),
    );

    // 把二维数组拍平
    let errorDict = {};
    const rows = allRows.flat();
    for (const o of rows) {
      if (o.error_code != 0) {
        o.ng_reason = await updateNgReason4Aiweishi(
          this.configService,
          stepNo,
          o.ng_reason,
        );
        o.ng_reason
          .split(';')
          .forEach((o) =>
            o in errorDict ? (errorDict[o] += 1) : (errorDict[o] = 1),
          );
      }
    }
    delete errorDict[''];

    // 总数
    let total = 0;
    for (let key in errorDict) {
      if (errorDict.hasOwnProperty(key)) {
        total += errorDict[key];
      }
    }
    // 计算百分比
    const stats = Object.entries(errorDict)
      .filter(([key, value]) => key !== '') // 过滤掉空字符串键
      .map(([error_code, count]) => ({ error_code, count }));
    return {
      totalGroups: total,
      stats,
    };
  }
  async getCalibErrorCodes(params: {
    material_code?: string;
    table?: string;
    stepNo: string;
    startTime?: string;
    endTime?: string;
    cameraSN?: string;
  }) {
    const { stepNo, startTime, endTime, cameraSN, table, material_code } =
      params;

    let tableName = 'mo_calibration';
    let sqlList: string[] = [
      `
      SELECT mo_calibration.error_code, COUNT(*) AS count
      FROM mo_calibration
      INNER JOIN mo_beam_info 
        ON mo_beam_info.beam_sn = mo_calibration.camera_sn
      INNER JOIN mo_produce_order 
        ON mo_produce_order.work_order_code = mo_beam_info.work_order_code
        AND mo_produce_order.material_code = '${material_code}'
      `,
      `
      SELECT mo_calibration.error_code, COUNT(*) AS count
      FROM mo_calibration
      INNER JOIN mo_tag_info 
        ON mo_tag_info.tag_sn = mo_calibration.camera_sn
      INNER JOIN mo_produce_order 
        ON mo_produce_order.work_order_code = mo_tag_info.work_order_code
        AND mo_produce_order.material_code = '${material_code}'
      `,
    ];
    // 动态条件
    const conditions: string[] = [];
    if (startTime)
      conditions.push(`\`${tableName}\`.start_time >= '${startTime}'`);
    if (endTime) conditions.push(`\`${tableName}\`.start_time <= '${endTime}'`);
    if (cameraSN) conditions.push(`\`${tableName}\`.cameraSN = '${cameraSN}'`);

    // 拼接 WHERE/AND + GROUP BY
    sqlList = sqlList.map((sql) => {
      if (conditions.length > 0) {
        if (sql.toUpperCase().includes('WHERE')) {
          sql += ' AND ' + conditions.join(' AND ');
        } else {
          sql += ' WHERE ' + conditions.join(' AND ');
        }
      }
      sql += ` GROUP BY \`${tableName}\`.error_code ORDER BY count DESC`;
      return sql;
    });

    // 并行执行 SQL
    const allRows: any = await Promise.all(
      sqlList.map((sql) => {
        console.log(sql);
        return this.prisma.$queryRawUnsafe(sql);
      }),
    );

    // 把二维数组拍平
    const rows = allRows.flat();

    // 总数
    const total = rows.reduce((sum, r) => sum + Number(r.count), 0);

    // 计算百分比
    const stats = rows.map((r) => {
      const count = Number(r.count);
      return {
        error_code: r.error_code !== null ? r.error_code.toString() : 'null',
        count,
        percent: total === 0 ? '0%' : ((count / total) * 100).toFixed(1) + '%',
      };
    });

    return {
      totalGroups: total,
      stats,
    };
  }

  async getFQCErrorCodes(params: {
    material_code?: string;
    table?: string;
    stepNo: string;
    startTime?: string;
    endTime?: string;
    cameraSN?: string;
  }) {
    const { stepNo, startTime, endTime, cameraSN, table, material_code } =
      params;

    let tableName = 'mo_final_check';
    let sqlList: string[] = [
      `
      SELECT check_result, COUNT(*) AS count
      FROM mo_final_check
      INNER JOIN mo_beam_info 
        ON mo_beam_info.beam_sn = mo_final_check.camera_sn
      INNER JOIN mo_produce_order 
        ON mo_produce_order.work_order_code = mo_beam_info.work_order_code
        AND mo_produce_order.material_code = '${material_code}'
      `,
    ];
    // 动态条件
    const conditions: string[] = [];
    if (startTime)
      conditions.push(`\`${tableName}\`.start_time >= '${startTime}'`);
    if (endTime) conditions.push(`\`${tableName}\`.start_time <= '${endTime}'`);
    if (cameraSN) conditions.push(`\`${tableName}\`.cameraSN = '${cameraSN}'`);

    // 拼接 WHERE/AND + GROUP BY
    sqlList = sqlList.map((sql) => {
      if (conditions.length > 0) {
        if (sql.toUpperCase().includes('WHERE')) {
          sql += ' AND ' + conditions.join(' AND ');
        } else {
          sql += ' WHERE ' + conditions.join(' AND ');
        }
      }
      sql += ` GROUP BY \`${tableName}\`.check_result ORDER BY count DESC`;
      return sql;
    });

    // 并行执行 SQL
    const allRows: any = await Promise.all(
      sqlList.map((sql) => {
        return this.prisma.$queryRawUnsafe(sql);
      }),
    );

    // 把二维数组拍平
    const rows = allRows.flat();

    // 总数
    const total = rows.reduce((sum, r) => sum + Number(r.count), 0);

    // 计算百分比
    const stats = rows.map((r) => {
      const count = Number(r.count);
      return {
        error_code: r.check_result !== null ? (r.check_result ? 0 : 1).toString() : 'null',
        count,
        percent: total === 0 ? '0%' : ((count / total) * 100).toFixed(1) + '%',
      };
    });

    return {
      totalGroups: total,
      stats,
    };
  }

  async getFlows(material_code: string) {
    // 1. 先查生产订单
    const orders = await this.prisma.mo_produce_order.findMany({
      where: { material_code },
    });

    // 2. 遍历每条记录，查找对应流程描述/名称
    const flows = await Promise.all(
      orders.map(async (item) => {
        if (!item.flow_code) return null; // 没有 flow_code 就跳过

        // 查流程名称（根据 flow_code）
        const flow = await this.prisma.mo_process_flow.findFirst({
          where: { process_code: item.flow_code },
        });

        return {
          flow_code: item.flow_code,
          flow_desc: item.description,
          flow_name: flow?.process_name ?? null,
        };
      }),
    );

    // 3. 过滤掉 null
    return flows.filter((f): f is NonNullable<typeof f> => f !== null);
  }

  async getSteps(flowCode: string) {
    const res = await this.prisma.mo_process_flow.findMany({
      where: { process_code: flowCode },
    });
    const stage_codes = res.map((item) => {
      if (item && item?.stage_code) {
        return {
          id: item.id,
          stage_code: item.stage_code,
        };
      }
    });

    return this.getStepNo(stage_codes);
  }

  async getStepNo(stage_code) {
    // 1. 建一个字典
    const codeMap = stage_code.reduce((acc, cur) => {
      acc[cur.stage_code] = cur.id;
      return acc;
    }, {});

    // 2. 查询
    const res = await this.prisma.mo_workstage.findMany({
      where: { stage_code: { in: stage_code.map((item) => item.stage_code) } },
    });

    // 3. 返回
    return res.map((item: any) => ({
      id: codeMap[item.stage_code] ?? null,
      stage_name: item.stage_name,
      step_no: item.step_type_no,
      target_table: item.target_table,
    }));
  }
}
