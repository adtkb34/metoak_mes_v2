import { Controller, Get, Query } from '@nestjs/common';
import { DeviceManagementService } from './device-management.service';

@Controller('device-management')
export class DeviceManagementController {
  constructor(
    private readonly deviceManagementService: DeviceManagementService,
  ) {}

  @Get('devices')
  async getDeviceOptions() {
    return await this.deviceManagementService.getDeviceOptions();
  }

  @Get('efficiency-statistics')
  async getEfficiencyStatistics(
    @Query('deviceId') deviceId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('interval') interval?: string,
  ) {
    return await this.deviceManagementService.getEfficiencyStatistics({
      deviceId,
      start,
      end,
      interval,
    });
  }
}
