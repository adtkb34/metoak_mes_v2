import { Injectable } from '@nestjs/common';

interface EfficiencyStatisticsParams {
  deviceId: string;
  start?: string;
  end?: string;
  interval?: string;
}

@Injectable()
export class DeviceManagementService {
  async getDeviceOptions() {
    return [];
  }

  async getEfficiencyStatistics(params: EfficiencyStatisticsParams) {
    return {
      deviceId: params.deviceId,
      start: params.start,
      end: params.end,
      interval: params.interval,
      points: [],
    };
  }
}
