import { ConfigService } from '@nestjs/config';
import { ProductOrigin } from '../enums/product-origin.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { STEP_NO } from '../../utils/stepNo';

export interface ErrorReasonRow {
  error_code?: string | number | null;
  ng_reason?: string | null;
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

export async function populateAiweishiAANgReasonFromErrorCode<
  T extends ErrorReasonRow,
>(
  rows: T[],
  configService: ConfigService,
  stepNo: string = STEP_NO.AUTO_ADJUST,
): Promise<T[]> {
  for (const row of rows) {
    row.ng_reason = await updateNgReason4Aiweishi(
      configService,
      stepNo,
      row.ng_reason,
    );
  }

  return rows;
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
    if (row.error_code != null) {
      let error_code_ = String(row.error_code);

      if (procedure_ === 'calibration' && error_code_.length > 1) {
        error_code_ = error_code_.slice(1);
      }

      row.ng_reason = errorMap.get(error_code_) ?? '';
    } else {
      row.ng_reason = '';
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
