import { http } from "@/utils/http";

export interface DeviceOption {
  label: string;
  value: string;
}

export interface EfficiencyPoint {
  timestamp: string;
  quantity: number;
}

export interface EfficiencyStatisticsResponse {
  deviceId: string;
  start?: string;
  end?: string;
  interval?: string;
  points: EfficiencyPoint[];
}

export const getDeviceOptions = () => {
  return http.request<DeviceOption[]>("get", "/device-management/devices");
};

export const getDeviceEfficiencyStatistics = (params: {
  deviceId: string;
  start?: string;
  end?: string;
  interval?: string;
}) => {
  return http.request<EfficiencyStatisticsResponse>(
    "get",
    "/device-management/efficiency-statistics",
    {
      params
    }
  );
};
