import { defineFakeRoute } from "vite-plugin-fake-server/client";
import type {
  DashboardSummaryParams,
  ProcessDetailParams,
  DashboardProductsParams
} from "@/api/dashboard.types";
import {
  buildDashboardSummary,
  buildProcessDetail,
  buildDashboardProducts
} from "@/api/dashboard-mock";

export default defineFakeRoute([
  {
    url: "/dashboard/summary",
    method: "post",
    response: ({ body }) => {
      const params = (body ?? {}) as DashboardSummaryParams;
      try {
        const data = buildDashboardSummary(params);
        return {
          success: true,
          data
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error ? error.message : "获取仪表盘数据失败"
        };
      }
    }
  },
  {
    url: "/dashboard/process-detail",
    method: "post",
    response: ({ body }) => {
      const payload = (body ?? {}) as Partial<ProcessDetailParams>;
      if (!payload.processId) {
        return {
          success: false,
          message: "缺少工序ID"
        };
      }
      try {
        const data = buildProcessDetail(payload as ProcessDetailParams);
        return {
          success: true,
          data
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "获取工序详情失败"
        };
      }
    }
  },
  {
    url: "/dashboard/products",
    method: "get",
    response: ({ query }) => {
      const params = (query ?? {}) as DashboardProductsParams;
      try {
        const data = buildDashboardProducts(params);
        return {
          success: true,
          data
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "获取产品选项失败"
        };
      }
    }
  }
]);
