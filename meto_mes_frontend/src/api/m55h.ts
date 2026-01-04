import { http } from "@/utils/http";

// M55H单目终检数据模型
export interface FinalCheckMonoM55h {
  id: number;
  mo_process_step_production_result_id?: string; // 改为string类型以处理BigInt
  start_time?: string; // 保持string类型
  end_time?: string; // 保持string类型
  sn?: string;
  error_code?: number;
  operator?: string;
  image_ok?: boolean;
  image_path?: string;
  check_result?: number;
  can0_ok?: number;
  can1_ok?: number;
  version_mcu_ref?: string;
  version_mcu_std?: string;
  version_product_ref?: string;
  version_product_std?: string;
  is_image_dirty_detect_enabled?: boolean;
  image_dirty_count?: number | null;
  is_board_clarity_detect_enabled?: boolean;
  board_clarity?: number;
  board_clarity_ref_min?: number;
  is_board_color_cast_detect_enabled?: boolean;
  board_color_cast_r_mean?: number;
  board_color_cast_g_mean?: number;
  board_color_cast_b_mean?: number;
  board_color_cast_r_stddev?: number;
  board_color_cast_g_stddev?: number;
  board_color_cast_b_stddev?: number;
  board_color_cast_maxdiff_ratio_ref?: number;
  board_color_cast_maxdiff_value_ref?: number;
  is_board_cod_detect_enabled?: boolean;
  board_cod_x?: number;
  board_cod_y?: number;
  board_cod_x_ref?: number;
  board_cod_x_tolerance?: number;
  board_cod_y_ref?: number;
  board_cod_y_tolerance?: number;
  aa?: boolean | null;
  bb?: number | null;
  camera_type?: number;
}

// 分页查询响应数据
export interface PageResponse {
  list: FinalCheckMonoM55h[];
  total: number;
}

// 统计信息数据模型
export interface StatisticsData {
  total_count: number;
  ok_count: number;
  ng_count: number;
  ok_rate: number;
}

// 上传检测数据
export const uploadFinalCheckData = (data: Partial<FinalCheckMonoM55h>) => {
  return http.request<FinalCheckMonoM55h>("post", "/m55h/upload", { data });
};

// 查询SN是否重复
export const isSnRepeated = (sn: string) => {
  return http.request<boolean>("get", "/m55h/is-sn-repeated", { params: { sn } });
};

// 分页查询
export const getPageData = (params: {
  page: number;
  pageSize: number;
  sn?: string;
}) => {
  return http.request<PageResponse>("get", "/m55h/page", { params });
};

// 根据SN查询详情
export const getDetailBySn = (sn: string) => {
  return http.request<FinalCheckMonoM55h>("get", "/m55h/detail", { params: { sn } });
};

// 统计信息查询
export const getStatistics = (params: {
  startDate?: string;
  endDate?: string;
}) => {
  return http.request<StatisticsData>("get", "/m55h/statistics", { params });
};

// 根据操作员查询
export const getDataByOperator = (params: {
  operator: string;
  page: number;
  pageSize: number;
}) => {
  return http.request<PageResponse>("get", "/m55h/by-operator", { params });
};

// 根据时间范围查询
export const getDataByDateRange = (params: {
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
}) => {
  return http.request<PageResponse>("get", "/m55h/by-date-range", { params });
};

// 查询失败记录
export const getFailedRecords = (params: {
  page: number;
  pageSize: number;
}) => {
  return http.request<PageResponse>("get", "/m55h/failed", { params });
};