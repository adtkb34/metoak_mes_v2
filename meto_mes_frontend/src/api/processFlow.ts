import { baseUrlApi } from "@/router/utils";
import { getUserAuth } from "@/utils/auth";
import { http } from "@/utils/http";
import type { ProductOrigin } from "@/enums/product-origin";

export type StageCode = string;
export type ProcessFlowSteps = {
  target_table: string;
  stage_code: StageCode;
  stage_name: string;
  stage_desc: string;
  step_type_no: string;
};

export type ProcessFlow = {
  process_code: string;
  process_name: string;
  process_desc: string;
  stage_codes: StageCode[];
};

const user_level = getUserAuth().user_level;

export const getProcessSteps = () => {
  return http.request<Array<ProcessFlowSteps>>(
    "get",
    "/basic-information/process-stages"
  );
};

export const createProcessSteps = stage => {
  return http.request<ProcessFlowSteps>(
    "post",
    "/basic-information/process-stage",
    {
      data: {
        user_level,
        ...stage
      }
    }
  );
};

export const updateProcessSteps = stage => {
  return http.request<ProcessFlowSteps>(
    "patch",
    "/basic-information/process-stage",
    {
      params: {
        stage_code: stage.stage_code,
        user_level
      },
      data: {
        ...stage
      }
    }
  );
};

export const deleteProcessStep = (stage_codes: string[]) => {
  return http.request("delete", "/basic-information/process-stages", {
    data: {
      user_level,
      stage_codes
    }
  });
};

export const getProcessFlow = (origin?: ProductOrigin | null) => {
  const config =
    origin === undefined || origin === null
      ? undefined
      : { params: { origin } };

  return http.request<Array<ProcessFlow>>(
    "get",
    "/basic-information/process-flow",
    config
  );
};

export const createProcessFlow = data => {
  return http.request<Array<ProcessFlow>>(
    "post",
    "/basic-information/process-flow",
    { params: { user_level } },
    { data }
  );
};

export const updateProcessFlow = data => {
  return http.request<Array<ProcessFlow>>(
    "patch",
    "/basic-information/process-flow",
    { params: { user_level } },
    { data }
  );
};

export const deleteProcessFlow = process_code => {
  return http.request<Array<ProcessFlow>>(
    "delete",
    "/basic-information/process-flow",
    { params: { user_level, process_code } }
  );
};
