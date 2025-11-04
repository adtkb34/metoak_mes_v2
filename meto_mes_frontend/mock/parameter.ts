import { defineFakeRoute } from "vite-plugin-fake-server/client";
import type { ParameterConfig } from "types/parameter";
import {
  addParameterMockConfig,
  getParameterMockConfig,
  getParameterMockOptions,
  listParameterMockConfigs,
  updateParameterMockConfig
} from "../src/mocks/parameter";

const shouldUseParameterMock = (() => {
  const flag = process.env.VITE_USE_PARAMETER_MOCK;
  if (flag === undefined) return false;
  return String(flag).toLowerCase() === "true";
})();

export default shouldUseParameterMock
  ? defineFakeRoute([
      {
        url: "/parameter/configs",
        method: "get",
        response: () => ({
          success: true,
          data: listParameterMockConfigs()
        })
      },
      {
        url: "/parameter/configs/:id",
        method: "get",
        response: ({ params }) => {
          const id = typeof params?.id === "string" ? params.id : "";
          const target = getParameterMockConfig(id);
          if (!target) {
            return {
              success: false,
              message: "未找到参数配置"
            };
          }
          return {
            success: true,
            data: target
          };
        }
      },
      {
        url: "/parameter/configs",
        method: "post",
        response: ({ body }) => {
          const payload = body as ParameterConfig;
          const result = addParameterMockConfig(payload);
          return result.success
            ? { success: true }
            : { success: false, message: result.message };
        }
      },
      {
        url: "/parameter/configs/:id",
        method: "put",
        response: ({ body, params }) => {
          const id = typeof params?.id === "string" ? params.id : "";
          const payload = body as ParameterConfig;
          const result = updateParameterMockConfig(id, payload);
          return result.success
            ? { success: true }
            : { success: false, message: result.message };
        }
      },
      {
        url: "/parameter/options",
        method: "get",
        response: () => ({
          success: true,
          data: getParameterMockOptions()
        })
      }
    ])
  : [];
