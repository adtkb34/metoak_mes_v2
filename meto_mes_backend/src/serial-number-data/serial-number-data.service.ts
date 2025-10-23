import { Injectable } from '@nestjs/common';

export interface SerialNumberProcessData {
  serialNumber: string;
  processes: Array<{
    name: string;
    status: string;
    timestamp?: string;
    [key: string]: unknown;
  }>;
}

@Injectable()
export class SerialNumberDataService {
  /**
   * Retrieve process data for a given serial number.
   *
   * TODO: Replace the mock implementation with an integration
   * to the underlying data sources once they are available.
   */
  async getProcessDataBySerialNumber(serialNumber: string): Promise<SerialNumberProcessData> {
    return {
      serialNumber,
      processes: [],
    };
  }
}
