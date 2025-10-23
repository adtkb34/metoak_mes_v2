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
  type ProcessMetricsResult,
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

  @Post('process-metrics')
  async getProcessMetrics(
    @Body()
    body: {
      origin?: string | number | null;
      product?: string | null;
      processIds?: string[] | string | null;
      startDate?: string;
      endDate?: string;
      equipmentIds?: string[] | string | null;
      stationIds?: string[] | string | null;
    },
  ): Promise<{ success: true; data: ProcessMetricsResult }> {
    const origin = this.parseOrigin(body?.origin);

    const data = await this.dashboardService.getProcessMetrics({
      origin,
      product: body?.product ?? null,
      processIds: this.normalizeStringArray(body?.processIds),
      startDate: body?.startDate,
      endDate: body?.endDate,
      equipmentIds: this.normalizeStringArray(body?.equipmentIds),
      stationIds: this.normalizeStringArray(body?.stationIds),
    });

    return { success: true, data };
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
