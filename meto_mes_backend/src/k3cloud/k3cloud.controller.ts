// src/k3cloud/k3cloud.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { K3CloudService } from './k3cloud.service';

@Controller('k3cloud')
export class K3CloudController {
  constructor(private readonly k3cloudService: K3CloudService) {}

  @Get('prd-mo')
  async getPrdMO() {
    const raw = await this.k3cloudService.queryPrdMO();
    const fields = [
      'work_order_code',
      'material_name',
      'produce_count',
      'planned_starttime',
      'planned_endtime',
      'material_code',
      'completed_count',
    ];

    const data = raw.map((row: any[]) =>
      Object.fromEntries(row.map((v, i) => [fields[i], v])),
    );

    return {
      success: data.length > 0,
      data,
    };
  }

  @Get('materials')
  async getMaterials() {
    const data = await this.k3cloudService.queryMaterials();
    
    return {
      success: data.length > 0,
      data,
    };
  }

  @Get('materials/jian')
  async getJianMaterials() {
    const data = await this.k3cloudService.queryJianMaterials();
    
    return {
      success: data.length > 0,
      data,
    };
  }

  @Get('bom/items')
  async getBomItems(
    @Query('productCode') productCode: string,
  ) {
    const data = await this.k3cloudService.queryBomItems(productCode);
    console.log(data)
    return {
      success: data.length > 0,
      data,
    };
  }
}
