import { Controller, Get, Query } from '@nestjs/common';
import { SerialNumberMaterialInfo } from 'src/serial-number-data/serial-number-data.service';
import {
  TraceabilityBaseResponse,
  TraceabilityProcessStepData,
  TraceabilityService,
} from './traceability.service';

@Controller('traceability')
export class TraceabilityController {
  constructor(private readonly traceabilityService: TraceabilityService) {}

  @Get('base')
  async getBaseInformation(
    @Query('serialNumber') serialNumber: string,
    @Query('processCode') processCode?: string,
  ): Promise<TraceabilityBaseResponse> {
    return this.traceabilityService.getBaseInformation(
      serialNumber,
      processCode,
    );
  }

  @Get('materials')
  async getMaterials(
    @Query('serialNumber') serialNumber: string,
  ): Promise<SerialNumberMaterialInfo[]> {
    return this.traceabilityService.getMaterials(serialNumber);
  }

  @Get('process')
  async getProcessData(
    @Query('serialNumber') serialNumber: string,
    @Query('stepTypeNo') stepTypeNo: string,
    @Query('processCode') processCode?: string,
  ): Promise<TraceabilityProcessStepData> {
    return this.traceabilityService.getProcessData(
      serialNumber,
      stepTypeNo,
      processCode,
    );
  }
}
