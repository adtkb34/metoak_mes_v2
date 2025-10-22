import { Controller, Get, Query } from '@nestjs/common';
import { ProductOrigin } from '../common/enums/product-origin.enum';
import { DashboardService, type ProductOption } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('products')
  async getProductOptions(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('origin') originParam?: string,
  ): Promise<{ success: true; data: ProductOption[] }> {
    const origin = this.parseOrigin(originParam);

    const data = await this.dashboardService.getProductOptions({ startDate, endDate, origin });

    return {
      success: true,
      data,
    };
  }

  private parseOrigin(value?: string): ProductOrigin | undefined {
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
}
