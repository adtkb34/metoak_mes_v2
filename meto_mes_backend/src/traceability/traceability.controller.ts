import { Controller, Get, Query } from '@nestjs/common';
import {
  TraceabilityResponse,
  TraceabilityService,
} from './traceability.service';

@Controller('traceability')
export class TraceabilityController {
  constructor(private readonly traceabilityService: TraceabilityService) {}

  @Get()
  async getTraceability(
    @Query('serialNumber') serialNumber: string,
  ): Promise<TraceabilityResponse> {
    return this.traceabilityService.getTraceability(serialNumber);
  }
}
