import { Controller, Get, Param } from '@nestjs/common';
import { SerialNumberDataService, SerialNumberProcessData } from './serial-number-data.service';

@Controller('serial-number-data')
export class SerialNumberDataController {
  constructor(private readonly serialNumberDataService: SerialNumberDataService) {}

  @Get(':serialNumber')
  getProcessData(@Param('serialNumber') serialNumber: string): Promise<SerialNumberProcessData> {
    return this.serialNumberDataService.getProcessDataBySerialNumber(serialNumber);
  }
}
