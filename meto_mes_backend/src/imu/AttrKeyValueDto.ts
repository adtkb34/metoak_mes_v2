// dto/AttrKeyValueDto.ts
export class AttrKeyValueDto {
  no: string;
  val: string;
  position: number;
}


export class SkuProductionProcessTaskDto {
  productionProcessErrorNo: string;
  attrKeyValues: AttrKeyValueDto[];
}

export class SkuProductionProcessDto2 {
  productSn: string;
  workstationNo: string;
  softwareTool: string;
  softwareToolVersion: string;
  operatorUserName: string;
  endTime: string;
  startTime: string;
  productionProcessNo: string;
  productionProcessError?: string;
  productionProcessErrorNo?: string;
  taskResults: SkuProductionProcessTaskDto[];
  calibresult_id: number;
}
