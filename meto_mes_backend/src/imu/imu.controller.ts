import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ImuCalibService } from './imu.service';
import { SkuProductionProcessDto2 } from './AttrKeyValueDto';
import { mo_fail, mo_success } from 'src/utils/response';

// 阈值范围定义
const THRESHOLD_RANGES: Record<string, [number, number]> = {
  'reprojection_error_cam0_mean': [-1e10, 0.13],
  'reprojection_error_cam0_std': [-1e10, 0.13],
  'gyroscope_error_imu0_mean': [-1e10, 0.01],
  'gyroscope_error_imu0_std': [-1e10, 0.02],
  'accelerometer_error_imu0_mean': [-1e10, 0.1],
  'accelerometer_error_imu0_std': [-1e10, 0.1],
  'tx_mm': [46, 56],
  'ty_mm': [0, 10],
  'tz_mm': [-30, -10],
  'timeshift_ms': [-10, 10],
  'q_angle': [-2, 2],
};

@Controller('imu')
export class ImuController {
  constructor(private readonly imuCalibService: ImuCalibService) {

  }
  private VERSION = "0.1.1";

  @Get('/')
  async getIMUResult(@Query('sn') sn: string) {
    console.log(sn);

    if (!sn) {
      throw new Error('Serial number (sn) is required');
    }
    const res = await this.imuCalibService.getCalibResults(sn);
    // 筛选所有满足所有阈值条件的结果
    const validResults = res.filter((row) => {
      return Object.entries(THRESHOLD_RANGES).every(([key, [min, max]]) => {
        const value = Number(row[key]);
        return !isNaN(value) && value >= min && value <= max;
      });
    });

    if (res.length === 0) {
      return mo_fail("sn not exist", -1);
    } else if (validResults.length === 0) {
      return mo_fail("data not valid");
    } else {
      return mo_success(validResults);
    }
  }

  @Post('upload')
  async uploadResult(@Body() dto: SkuProductionProcessDto2) {
    return await this.imuCalibService.addResult(dto);
  }
}