import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { WarehouseManagementService } from './warehouse-management.service';

@Controller('warehouse-management')
export class WarehouseManagementController {
  private startDate: Date;
  private endDate: Date;

  private setDate(start: string, end: string) {
    [this.startDate, this.endDate] = [new Date(start), new Date(end)];
  }

  constructor(private readonly warehouseService: WarehouseManagementService) { }

  @Get('/camera-sn')
  async getCameraSN(@Query('packing_code') packing_code: string) {
    return await this.warehouseService.getCameraSN(packing_code, this.startDate, this.endDate);
  }

  @Post('/camera-sn')
  async addCameraSN(@Body() body: { packing_code: string; camera_sn: string }) {
    return await this.warehouseService.addCameraSN(body.packing_code, body.camera_sn);
  }

  @Delete('/camera-sn')
  async deleteCameraSN(@Body() body: { camera_sn_list: string[] }) {
    return await this.warehouseService.deleteCameraSNs(body.camera_sn_list);
  }

  @Put('/camera-sn')
  async updateCameraSN(@Body() body: { old_sn: string; new_sn: string }) {
    return await this.warehouseService.updateCameraSN(body.old_sn, body.new_sn);
  }

  @Put('/return-repair')
  async markReturnRepair(
    @Body() body: { camera_sn_list: string[]; repair_date?: string },
  ) {
    console.log(body);
    
    return await this.warehouseService.markReturnRepair(
      body.camera_sn_list,
      body.repair_date,
    );
  }

  @Post('/packing-info')
  async getPackingInfo(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('packing_code') packing_code?: string,
    @Body('camera_sn_list') cameraSN?: string[],
  ) {
    return await this.warehouseService.getPackingInfo({
      start,
      end,
      packing_code,
      camera_sn_list: cameraSN
    });
  }
}