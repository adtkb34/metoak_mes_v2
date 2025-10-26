import { ConfigService } from '@nestjs/config';
import { ProductOrigin } from '../enums/product-origin.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { STEP_NO } from '../../utils/stepNo';

export interface ErrorReasonRow {
  error_code?: string | number | null;
  ng_reason?: string | null;
  station_num?: number | null;
}

export async function updateNgReason4Aiweishi(
  configService: ConfigService,
  stepNo: string,
  rawNgReason: string | null | undefined,
): Promise<string> {
  const ngReason = rawNgReason ?? '';
  const parts = ngReason
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!parts.length) {
    return '';
  }

  const baseUrl = configService.get<string>('MES_API_BASE');
  const token = configService.get<string>('MES_API_TOKEN');

  const results: string[] = [];

  for (const part of parts) {
    const [attrNo] = part.split('-');
    if (!attrNo) continue;

    const url = `${baseUrl}/api/mes/v1/stepAttrKeys/label?stepTypeNo=${stepNo}&attrNo=${attrNo}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token as string,
      },
    });

    const data = await response.json();
    if (data?.data) results.push(data.data);
  }

  return results.join(';');
}

export interface ParetoChartData {
  categories: string[];
  counts: number[];
  cumulative: number[];
}

export async function populateAiweishiAANgReasonFromErrorCode<
  T extends ErrorReasonRow,
>(
  rows: T[],
  configService: ConfigService,
  stepNo: string = STEP_NO.AUTO_ADJUST,
): Promise<ParetoChartData> {
  let mapAttrNo = {};
  let mapAttrKey: Record<string, number> = {};
  rows.forEach((o) => {
    if (!o.ng_reason) return; // 跳过空字符串
    o.ng_reason.split(',').forEach((o2) => {
      const key = o2.split('-')[0].trim();
      if (!key || !o.error_code) return;
      mapAttrNo[key] = (mapAttrNo[key] ?? 0) + 1;
    });
  });

  for (const attrNo of Object.keys(mapAttrNo)) {
    const key = await updateNgReason4Aiweishi(configService, stepNo, attrNo);
    mapAttrKey[key] = mapAttrNo[attrNo];
  }
  console.log(mapAttrKey);
  const sortedEntries = Object.entries(mapAttrKey).sort((a, b) => b[1] - a[1]);

  const categories = sortedEntries.map(([key]) => key);
  const counts = sortedEntries.map(([, value]) => value);

  // 计算累计百分比
  const total = counts.reduce((sum, c) => sum + c, 0);
  let cumulativeSum = 0;
  const cumulative = counts.map((count) => {
    cumulativeSum += count;
    return Number(((cumulativeSum / total) * 100).toFixed(1)); // 保留1位小数
  });

  return { categories, counts, cumulative };
  // return rows;
}

export async function populateCalibOrGUanghaojieAANgReasonFromErrorCode<
  T extends ErrorReasonRow,
>(
  prismaService: PrismaService,
  rows: T[],
  procedure_: string,
  origin: ProductOrigin = ProductOrigin.SUZHOU,
): Promise<T[]> {
  const client = prismaService.getClientByOrigin(origin);

  const records = await client.$queryRaw<
    Array<{ code: string | number; message: string }>
  >`
    SELECT code, message
    FROM error_descriptions
    WHERE procedure_ = ${procedure_}
  `;

  const errorMap = new Map<string, string>();
  for (const { code, message } of records) {
    if (code != null && message != null) {
      errorMap.set(String(code), message);
    }
  }

  for (const row of rows) {
    if (row.station_num != 7 && procedure_ == 'AA') {
      continue;
    }
    if (row.error_code != null) {
      let error_code_ = String(row.error_code);

      if (procedure_ === 'calibration' && error_code_.length > 1) {
        error_code_ = error_code_.slice(1);
      }
      row.ng_reason = errorMap.get(error_code_) ?? error_code_;
    }
  }

  return rows;
}

export async function populateFQCNgReasonFromErrorCode<
  T extends ErrorReasonRow,
>(
  prismaService: PrismaService,
  rows: T[],
  origin: ProductOrigin = ProductOrigin.SUZHOU,
): Promise<T[]> {
  const client = prismaService.getClientByOrigin(origin);

  const records = await client.$queryRaw<
    Array<{ code: string | number; message: string }>
  >`
    SELECT error_code AS code, description AS message
    FROM mo_error_desc
    WHERE stage = 'FQC'
  `;

  const errorMap = new Map<string, string>();
  for (const { code, message } of records) {
    if (code != null && message != null) {
      errorMap.set(String(code), message);
    }
  }

  for (const row of rows) {
    if (row.error_code != null) {
      const error_code_ = String(row.error_code);
      row.ng_reason = errorMap.get(error_code_) ?? '';
    } else {
      row.ng_reason = '';
    }
  }

  return rows;
}
