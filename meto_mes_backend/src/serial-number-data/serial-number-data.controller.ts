import { Controller, Get, Query } from '@nestjs/common';
import {
  SerialNumberDataService,
  SerialNumberAaBaseInfo,
} from './serial-number-data.service';

@Controller('serial-number-data')
export class SerialNumberDataController {
  constructor(
    private readonly serialNumberDataService: SerialNumberDataService,
  ) {}

  @Get()
  getProcessData(
    @Query('serialNumber') serialNumber: string,
    @Query('stepTypeNo') stepTypeNo: string,
  ): Promise<SerialNumberAaBaseInfo[]> {
    return this.serialNumberDataService.getProcessDataBySerialNumber(
      serialNumber,
      stepTypeNo,
    );
  }
}
