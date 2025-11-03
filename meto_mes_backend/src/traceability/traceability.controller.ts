import { Controller, Get, Query } from '@nestjs/common';
import {
  TraceabilityBaseResponse,
  TraceabilityMaterialCodeResponse,
  TraceabilityProcessStepData,
  TraceabilityService,
} from './traceability.service';
import { SerialNumberMaterialInfo } from 'src/serial-number-data/serial-number-data.service';

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

  @Get('material-code')
  async getMaterialCode(
    @Query('serialNumber') serialNumber: string,
  ): Promise<TraceabilityMaterialCodeResponse> {
    return this.traceabilityService.getMaterialCode(serialNumber);
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
