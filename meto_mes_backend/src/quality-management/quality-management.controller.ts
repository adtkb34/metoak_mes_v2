import { Controller, Get, Query } from '@nestjs/common';
import { QualityManagementService } from './quality-management.service';
import { mo_fail, mo_success } from 'src/utils/response';
import { PrismaService } from 'src/prisma/prisma.service';
import { STEP_NO } from 'src/utils/stepNo';

@Controller('quality-management')
export class QualityManagementController {
  constructor(
    private qualityService: QualityManagementService,
    private prisma: PrismaService
  ) { }

  @Get('/quality-analysis')
  getQualityAnalysis(@Query('start') start: string, @Query('end') end: string) {
    return this.qualityService.calcFirstPassYield(start, end);
  }

  @Get('/find-errors')
  findErrors(@Query('start') start: string, @Query('end') end: string) {
    const [startDate, endDate] = [new Date(start), new Date(end)];
    return this.qualityService.findErrorsInRange(startDate, endDate);
  }

  @Get('/quality-data')
  getQualityData(@Query('start') start: string, @Query('end') end: string) {
    // return this.qualityService.getQualityData(start, end);
  }


  @Get('/measure-distance')
  async getMeasureDistance(
    @Query('startDate') start: string,
    @Query('endDate') endTime_: string,
    @Query('distance') distance: string,
    @Query('precisions') precisions: string
  ) {
    let endTime
    if (!endTime_) {
      endTime = `${endTime_} 23:59:59`
    }
    // if (!start || !end || !precisions) {
    //   throw new BadRequestException('缺少必要参数 start / end / precisions');
    // }

    const precisionList = precisions.split(',').map(p => Number(p.trim()));

    return await this.qualityService.getMeasureDistanceData(start, endTime, distance, precisionList);
  }

  @Get('/stereo-calibration')
  async getStereoCalibration(
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('cameraSN') cameraSN?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string, // 新增
  ) {
    // let endTime
    // if (!endTime_) {
    //   endTime = `${endTime_} 23:59:59`
    // }
    return await this.qualityService.getStereoCalibration({
      startTime,
      endTime,
      cameraSN,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined, // 新增
    });
  }


  @Get('/others')
  async getOthers(
    @Query('stepNo') stepNo: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('cameraSN') cameraSN?: string,
    @Query('page') page?: string,
    @Query('material_code') material_code?: string,
  ) {
    const pageNumber = page ? Number(page) : null;
    const res = await this.qualityService.getTableData({
      stepNo,
      startTime,
      endTime,
      cameraSN,
      pageNumber,
      material_code,
    });
    return convertBigInt(res);
  }

  @Get('/others/error-codes')
  async getErrorCodes(
    @Query('stepNo') stepNo: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('cameraSN') cameraSN?: string,
    @Query('material_code') material_code?: string,
  ) {
    return await this.qualityService.getErrorCodesV2({
      stepNo,
      startTime,
      endTime,
      cameraSN,
      material_code,
    });
  }

  @Get('/flow')
  async getFlow(
    @Query('material_code') material_code: string,
  ) {
    if (!material_code) {
      return mo_fail();
    }
    const flowCode = await this.qualityService.getFlows(material_code);

    return mo_success(flowCode);
  }

  @Get('/machineData')
  async getMachineData(
    @Query('material_code') material_code: string,
    @Query('flow_code') flow_code: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime_?: string,
  ) {
    if (!flow_code) {
      return mo_fail();
    }
    let endTime
    if (!endTime_) {
      endTime = `${endTime_} 23:59:59`
    }
    const steps = await this.qualityService.getSteps(flow_code);
    // console.log(steps)
    // 判断工序有效性
    const hasValidStep = steps.some(item => item?.step_no);
    if (!hasValidStep) {
      return mo_fail('当前工艺无可用工序');
    }


    // 并行获取所有错误码
    const data = await Promise.all(
      steps
        .filter(item => item?.step_no)
        .map(async item => {
          if (!item?.step_no) {
            return;
          }
          let res: any = undefined;
          if (item.step_no === STEP_NO.CALIB) {
            res = await this.qualityService.getCalibErrorCodes({
              material_code: material_code,
              stepNo: item.step_no,
              startTime,
              endTime,
            })  
          } else if(item.step_no === STEP_NO.FQC) {
            res = await this.qualityService.getFQCErrorCodes({material_code, stepNo: item.step_no, startTime, endTime})  
          } else {
            res = await this.qualityService.getErrorCodes({
              material_code: material_code,
              stepNo: item.step_no,
              startTime,
              endTime,
            })
          }
          
          return {
            id: item.id,
            step: item.stage_name,
            data: res
          }
        }),
    );

    // 返回数据
    return mo_success(data);
  }
}

function convertBigInt(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(convertBigInt);
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = convertBigInt(obj[key]);
      }
    }
    return newObj;
  } else if (typeof obj === 'bigint') {
    return obj.toString();
  }
  return obj;
}

