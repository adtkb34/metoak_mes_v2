import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { ProductOrigin } from '../common/enums/product-origin.enum';
import {
  DashboardService,
  type ProcessDetailData,
  type ProductOption,
  type EquipmentOption,
  type DashboardSummaryResult,
  type ProcessMetricsSummary,
} from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post('summary')
  async getSummary(
    @Body()
    body: {
      startDate?: string;
      endDate?: string;
      origin?: string | number | null;
      product?: string | null;
      stepTypeNo?: string;
    },
  ): Promise<{ success: true; data: DashboardSummaryResult }> {
    const origin = this.parseOrigin(body?.origin);

    const data = await this.dashboardService.getDashboardSummary({
      startDate: body?.startDate,
      endDate: body?.endDate,
      origin,
      product: body?.product ?? null,
      stepTypeNo: body?.stepTypeNo,
    });

    return { success: true, data };
  }

  @Get('products')
  async getProductOptions(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('origin') originParam?: string,
  ): Promise<{ success: true; data: ProductOption[] }> {
    const origin = this.parseOrigin(originParam);

    const data = await this.dashboardService.getProductOptions({
      startDate,
      endDate,
      origin,
    });

    return {
      success: true,
      data,
    };
  }

  @Post('process-detail')
  async getProcessDetail(
    @Body()
    body: {
      processId?: string;
      startDate?: string;
      endDate?: string;
      origin?: string | number | null;
      product?: string | null;
      stepTypeNo?: string;
      equipmentIds?: string[] | string | null;
    },
  ): Promise<{ success: true; data: ProcessDetailData }> {
    const processId = body?.processId?.trim();
    if (!processId) {
      throw new BadRequestException('缺少工序ID');
    }

    const origin = this.parseOrigin(body?.origin);

    const equipmentIds = Array.isArray(body?.equipmentIds)
      ? body?.equipmentIds
      : body?.equipmentIds
        ? [String(body.equipmentIds)]
        : undefined;

    const data = await this.dashboardService.getProcessDetail({
      processId,
      startDate: body?.startDate,
      endDate: body?.endDate,
      origin,
      product: body?.product ?? null,
      stepTypeNo: body?.stepTypeNo,
      equipmentIds,
    });

    return { success: true, data };
  }

  @Get('process-metrics')
  async getProcessMetrics(
    @Query()
    query: {
      origin?: string | number | null;
      product: string;
      stepTypeNo?: string | null;
      startDate?: string;
      endDate?: string;
      deviceNos?: string[] | string | null;
      stations?: string[] | string | null;
    },
  ): Promise<{ success: true; data: ProcessMetricsSummary }> {
    const origin = this.parseOrigin(query?.origin);

    const summary = await this.dashboardService.getProcessMetrics({
      origin,
      product: query.product,
      stepTypeNo: query?.stepTypeNo?.trim(),
      startDate: query?.startDate,
      endDate: query?.endDate,
      deviceNos: this.normalizeStringArray(query?.deviceNos),
      stations: this.normalizeStringArray(query?.stations),
    });

    return { success: true, data: summary };
  }

  @Get('equipment-options')
  async getEquipmentOptions(
    @Query('stepTypeNo') stepTypeNo?: string,
    @Query('origin') originParam?: string,
  ): Promise<{ success: true; data: EquipmentOption[] }> {
    const normalizedStep = stepTypeNo?.trim();
    if (!normalizedStep) {
      throw new BadRequestException('缺少工序编号');
    }

    const origin = this.parseOrigin(originParam);
    if (origin === undefined) {
      throw new BadRequestException('缺少产地');
    }

    const data = await this.dashboardService.getEquipmentOptions(
      normalizedStep,
      origin,
    );

    return { success: true, data };
  }

  private parseOrigin(
    value?: string | number | null,
  ): ProductOrigin | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const numeric = Number(value);
    if (!Number.isInteger(numeric)) {
      return undefined;
    }

    const allowedOrigins = Object.values(ProductOrigin).filter(
      (item): item is ProductOrigin => typeof item === 'number',
    );

    return allowedOrigins.includes(numeric as ProductOrigin)
      ? (numeric as ProductOrigin)
      : undefined;
  }

  private normalizeStringArray(
    value?: string[] | string | null,
  ): string[] | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    const arrayValue = Array.isArray(value) ? value : [value];

    const normalized = arrayValue
      .map((item) => item?.trim())
      .filter((item): item is string => !!item);

    return normalized.length ? normalized : undefined;
  }
}
