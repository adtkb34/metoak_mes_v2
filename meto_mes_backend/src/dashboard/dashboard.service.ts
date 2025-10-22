import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductOrigin } from '../common/enums/product-origin.enum';

export interface ProductOption {
  label: string;
  code: string;
}

interface ProductOptionQueryParams {
  startDate?: string;
  endDate?: string;
  origin?: ProductOrigin;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProductOptions(params: ProductOptionQueryParams): Promise<ProductOption[]> {
    const { startDate, endDate, origin } = params;

    const conditions: Prisma.Sql[] = [Prisma.sql`product_sn IS NOT NULL`];

    const normalizedStart = this.normalizeDate('start', startDate);
    const normalizedEnd = this.normalizeDate('end', endDate);

    if (normalizedStart) {
      conditions.push(Prisma.sql`add_time >= ${normalizedStart}`);
    }

    if (normalizedEnd) {
      conditions.push(Prisma.sql`add_time <= ${normalizedEnd}`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

    try {
      const prismaClient = this.prisma.getClientByOrigin(origin);

      const rows = await prismaClient.$queryRaw<
        { material_name: string | null; material_code: string | null }[]
      >(Prisma.sql`
        WITH filtered_sn AS (
          SELECT DISTINCT product_sn
          FROM mo_process_step_production_result
          ${whereClause}
        ),
        work_orders AS (
          SELECT DISTINCT mbi.work_order_code
          FROM filtered_sn fs
          JOIN mo_beam_info mbi ON mbi.beam_sn = fs.product_sn
          WHERE mbi.work_order_code IS NOT NULL
          UNION
          SELECT DISTINCT mti.work_order_code
          FROM filtered_sn fs
          JOIN mo_tag_info mti ON mti.tag_sn = fs.product_sn
          WHERE mti.work_order_code IS NOT NULL
        )
        SELECT DISTINCT
          mpo.material_name,
          mpo.material_code
        FROM work_orders wo
        JOIN mo_produce_order mpo ON mpo.work_order_code = wo.work_order_code
        WHERE mpo.material_name IS NOT NULL
          AND mpo.material_code IS NOT NULL
        ORDER BY mpo.material_name, mpo.material_code;
      `);

      const unique = new Map<string, ProductOption>();

      for (const row of rows) {
        const materialName = row.material_name?.trim();
        if (!materialName) {
          continue;
        }

        const materialCode = row.material_code?.trim() ?? '';
        const code = materialName;
        const label = `${materialName}${materialCode}`;

        if (!unique.has(code)) {
          unique.set(code, { label, code });
        }
      }

      return Array.from(unique.values());
    } catch (error) {
      this.logger.error('Failed to load dashboard product options', error);
      throw error;
    }
  }

  private normalizeDate(kind: 'start' | 'end', value?: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return kind === 'start'
        ? `${trimmed} 00:00:00`
        : `${trimmed} 23:59:59`;
    }

    return trimmed;
  }
}
