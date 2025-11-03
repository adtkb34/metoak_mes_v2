import { baseUrlApi } from "@/router/utils";
import { http } from "@/utils/http";

export const getQualityData = (start: string, end: string) => {
  return http.request("get", "/quality-management/quality-analysis", {
    params: {
      start,
      end
    }
  });
};

export const getQualityDataByStep = (material_code: string, flow_code: string, start: string, end: string) => {
  return http.request("get", "/quality-management/quality-analysis", {
    params: {
      start,
      end
    }
  });
}

export const getQualityErrorData = (start: string, end: string) => {
  return http.request("get", "/quality-management/find-errors", {
    params: {
      start,
      end
    }
  });
};

export const getMeasureDistanceData = (params) => {
  return http.request("get", "/quality-management/measure-distance", {
    params: params
  });
};

// 导出测距 CSV 数据
export async function exportMeasureDistanceData(params) {
  return http.get('/quality-management/measure-distance/export', {
    params,
    responseType: 'blob', // 返回文件流
  })
}

export const getStereoCalibrationData = (params) => {
  return http.request("get", "/quality-management/stereo-calibration", {
    params: params
  });
};

export const getOthersData = (params) => {
  return http.request("get", "/quality-management/others", {
    params: params
  });
};

export const getOthersDataErrorCodes = (params) => {
  return http.request<any>("get", "/quality-management/others/error-codes", {
    params: params
  });
};

export const getMachine = () => {
  return http.request<any>("get", "/k3cloud/materials");
};

export const getFlowCodeByMaterial = (material_code: string) => {
  return http.request<any>("get", "/quality-management/flow", {
    params: {
      material_code
    }
  })
}

export const getDataByMachine = async (params) => {
  const res = await http.request<any>("get", "/quality-management/machineData", {
    params: params
  });

  if (res && res?.data) {
    res.data.sort((a, b) => a.id - b.id); // 升序
  }

  return res;
};
