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
  type ProcessStageInfo,
  type ParetoChartData,
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

    const startDate =
      this.normalizeDateParam('start', body?.startDate) ?? body?.startDate;
    const endDate =
      this.normalizeDateParam('end', body?.endDate) ?? body?.endDate;

    const data = await this.dashboardService.getDashboardSummary({
      startDate,
      endDate,
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

    const normalizedStart =
      this.normalizeDateParam('start', startDate) ?? startDate;
    const normalizedEnd = this.normalizeDateParam('end', endDate) ?? endDate;

    const data = await this.dashboardService.getProductOptions({
      startDate: normalizedStart,
      endDate: normalizedEnd,
      origin,
    });

    return {
      success: true,
      data,
    };
  }

  // @Post('process-detail')
  // async getProcessDetail(
  //   @Body()
  //   body: {
  //     processId?: string;
  //     startDate?: string;
  //     endDate?: string;
  //     origin?: string | number | null;
  //     product?: string | null;
  //     stepTypeNo?: string;
  //     equipmentIds?: string[] | string | null;
  //   },
  // ): Promise<{ success: true; data: ProcessDetailData }> {
  //   const processId = body?.processId?.trim();
  //   if (!processId) {
  //     throw new BadRequestException('缺少工序ID');
  //   }

  //   const origin = this.parseOrigin(body?.origin);

  //   const equipmentIds = Array.isArray(body?.equipmentIds)
  //     ? body?.equipmentIds
  //     : body?.equipmentIds
  //       ? [String(body.equipmentIds)]
  //       : undefined;

  //   const startDate =
  //     this.normalizeDateParam('start', body?.startDate) ?? body?.startDate;
  //   const endDate =
  //     this.normalizeDateParam('end', body?.endDate) ?? body?.endDate;

  //   const data = await this.dashboardService.getProcessDetail({
  //     processId,
  //     startDate,
  //     endDate,
  //     origin,
  //     product: body?.product ?? null,
  //     stepTypeNo: body?.stepTypeNo,
  //     equipmentIds,
  //   });

  //   return { success: true, data };
  // }

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
    console.log(query?.stepTypeNo);
    const summary = await this.dashboardService.getProcessMetrics({
      origin,
      product: query.product,
      stepTypeNo: query?.stepTypeNo?.trim(),
      startDate: query.startDate,
      endDate: query.endDate,
      deviceNos: this.normalizeStringArray(query?.deviceNos),
      stations: this.normalizeStringArray(query?.stations),
    });

    return { success: true, data: summary };
  }

  @Get('pareto')
  async getParetoData(
    @Query('product') product?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('origin') originParam?: string,
    @Query('stepTypeNo') stepTypeNo?: string,
  ): Promise<{ success: true; data: ParetoChartData }> {
    const normalizedProduct = product?.trim();
    if (!normalizedProduct) {
      throw new BadRequestException('缺少产品');
    }

    const normalizedStep = stepTypeNo?.trim();
    if (!normalizedStep) {
      throw new BadRequestException('缺少工序编号');
    }

    const origin = this.parseOrigin(originParam);
    if (origin === undefined) {
      throw new BadRequestException('缺少产地');
    }

    const normalizedStart =
      this.normalizeDateParam('start', startDate) ?? startDate;
    const normalizedEnd = this.normalizeDateParam('end', endDate) ?? endDate;

    const data = await this.dashboardService.getParetoData({
      product: normalizedProduct,
      stepTypeNo: normalizedStep,
      origin,
      startDate: normalizedStart,
      endDate: normalizedEnd,
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

  @Get('process-stage-info')
  async getProcessStageInfo(
    @Query('processCode') processCode?: string,
  ): Promise<{ success: true; data: ProcessStageInfo[] }> {
    const normalizedCode = processCode?.trim();
    if (!normalizedCode) {
      throw new BadRequestException('缺少工艺编号');
    }

    const data = await this.dashboardService.getProcessStages(normalizedCode);
    console.log(1, data);
    return { success: true, data };
  }

  private normalizeDateParam(
    kind: 'start' | 'end',
    value?: string,
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return kind === 'end' ? `${trimmed} 23:59:59` : `${trimmed} 00:00:00`;
    }

    return trimmed;
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
