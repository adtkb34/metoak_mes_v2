import { Body, Controller, Delete, ForbiddenException, Get, Patch, Post, Query } from '@nestjs/common';
import { ProductionManagementService } from './production-management.service';
import { UpdateMoProduceOrderDto } from './update-order.dto';

function formatDate(dateStr: string | null): string | null {
  if (!dateStr || dateStr === '0000-00-00 00:00:00') return null;
  return dateStr.split(' ')[0];
}

@Controller('production-management')
export class ProductionManagementController {
  constructor(
    private readonly productionService: ProductionManagementService,
  ) { }

  @Get('produce-orders')
  async getWordOrders() {
    const result = await this.productionService.getProduceOrders();
    
    return result
    .filter(order => {
      const order_code = order.work_order_code.split('_');
      return order_code.length === 1;
    })
    .map(order => ({
      ...order,
      planned_starttime: formatDate(order.planned_starttime),
      planned_endtime: formatDate(order.planned_endtime)
    }))
  }

  @Post('produce-order')
  async createOrder(
    @Query('user_level') user_level: number,
    @Body() dto
  ) {
    this.validate(user_level);

    const data = {
      ...dto,
      order_date: new Date().toISOString()
      
    }
    console.log(data)
    return this.productionService.createProduceOrder(data);
  }

  private validate(user_level) {
    if (user_level === undefined || user_level > 1) {
      throw new ForbiddenException('Permission denied');
    }
  }

  @Patch('produce-order')
  async updateOrder(
    @Query('user_level') user_level: number,
    @Query('order_code') order_code: string,
    @Body() dto: UpdateMoProduceOrderDto
  ) {
    this.validate(user_level);

    return this.productionService.updateProduceOrder(order_code, dto);
  }

  @Delete('produce-orders')
  async deleteOrder(
    @Query('user_level') user_level: number,
    @Query('order_code') order_code: string
  ) {
    this.validate(user_level);

    return this.productionService.deleteProduceOrder(order_code);
  }
}
