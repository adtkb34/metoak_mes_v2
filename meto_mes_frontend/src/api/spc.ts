import { http } from "@/utils/http";

interface SpcItemDto {
  label: string;
  value: number;
};

interface SpcReqDto {
  // 待分析项目id
  spuId: number;
  stepId: number;
  taskId: number;
  attrKeyId: number;

  // 数据维度
  start: Date;
  end: Date;
  capacity: number;
};

interface SpcResDto {
  data: number[];

  // 控制参数
  ucl: number;
  lcl: number;
};

type SpcKeyValues = Array<{
  key: string,
  label: string
}>

const SPC_STEP_ROUTE = "/spc/steps";
const SPC_ATTR_ROUTE = "/spc/attrs";
const SPC_VAL_ROUTE = "/spc/series";

export const getSpcSteps = async () => {
  return await http.request<SpcKeyValues>("get", SPC_STEP_ROUTE);
}

export const getSpcAttrs = async (stepNo: String) => {
  return await http.request<SpcKeyValues>("get", SPC_ATTR_ROUTE, { params: { stepNo } });
}

export const getSpcValues = async (
  stepNo: string,
  field: string,
  limit: number,
  position: string | undefined,
  station: string | undefined,
  start?: string,
  end?: string,
) => {
  const payload = {
    stepNo,
    field,
    start,
    position,
    station,
    end,
    limit
  }
  console.log(payload);

  const res = await http.request<number[]>("get", SPC_VAL_ROUTE, {
    params: payload
  });
  console.log(res);
  return res
}

export const getConfig = async (userId: string, tableName: string, field: string) => {
  let res = await http.request<Promise<SpcConfig>>("get", "/spc/config", {
    params: {
      userId: userId,
      tableName,
      field
    }
  })
  if (!res) {
    res = await http.request<Promise<SpcConfig>>("get", "/spc/config", {
      params: {
        userId: 'szdev',
        tableName,
        field
      }
    })

  }
  return {
    lsl: res.lsl ? res.lsl : 0,
    usl: res.usl ? res.usl : 0,
    is_real_time: res.is_real_time,
    rules: res.rules ? res.rules : 0,
    subgroup_length: res.subgroup_length ? res.subgroup_length : 1
  };
}

export interface SpcConfig {
  user_name: string,
  station?: string,
  table_name?: string,
  field_name?: string,
  usl?: number,
  lsl?: number,
  subgroup_length?: number,
  rules?: number,
  is_real_time?: boolean,
  statistics_length?: number,
  position?: string
}

export const uploadConfig = async (config: SpcConfig) => {
  return await http.request("post", "/spc/config", {
    data: config
  })
}