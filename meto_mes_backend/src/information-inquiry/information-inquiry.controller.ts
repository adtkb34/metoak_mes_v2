import { Controller, Get, Query } from '@nestjs/common';
import { InformationInquiryService } from './information-inquiry.service';

@Controller('information-inquiry')
export class InformationInquiryController {
  constructor(private readonly informationService: InformationInquiryService) {}

  @Get('/product-traceability')
  async getProductInfo(@Query('sn') sn: string) {
    const adjustInfo = await this.informationService.getAdjustInfo(sn);
    const FQCInfo = await this.informationService.getFQCInfo(sn);
    const OQCInfo = await this.informationService.getOQCInfo(sn);
    const calibrationInfo = await this.informationService.getCalibrationInfo(sn);
    const orderInfo = await this.informationService.getBeamDetail(sn);
    const packingInfo = await this.informationService.getPackingInfo(sn);
    const cameraInfo = await this.informationService.getCameraInfo(sn);
    const shellInfo = await this.informationService.getShellInfo(sn);
    const assembleInfo = await this.informationService.getAssembleInfo(sn);

    return {
      adjustInfo,
      FQCInfo,
      OQCInfo,
      calibrationInfo,
      orderInfo,
      packingInfo,
      cameraInfo,
      shellInfo,
      assembleInfo,
    }
  }

  @Get('/product-traceability/v2')
  async getProductInfoV2(@Query('sn') sn: string, @Query('flowCode') flowCode: string) {
      return await this.informationService.getProductInfoV2(sn, flowCode);
  }
}
