import { Controller, Get, Query } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) { }



  @Get('/produce-order')
  getHome() {
    return this.homeService.getProduceOrder();
  }

  @Get('/output-history')
  getOutputHistory() {
    return this.homeService.getOutputHistory();
  }

  @Get('/output-today')
  async getOutputToday() {
    const result = await this.homeService.getOutputToday();

    return result.map((item) => ({
      stage: item.stage,
      num: item.num.toString(),
    }));
  }

  @Get('product-info')
  async getProducts(@Query('table') tableName) {
    return await this.homeService.getCachedProductInfo(tableName);
  }
}
