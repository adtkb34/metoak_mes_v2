import { defineFakeRoute } from "vite-plugin-fake-server/client";
import type {
  ParameterConfig,
  ParameterNode,
  ParameterOptions
} from "types/parameter";

const products: ParameterOptions["products"] = [
  { label: "产品A", value: "product_a" },
  { label: "产品B", value: "product_b" },
  { label: "产品C", value: "product_c" }
];

const processes: ParameterOptions["processes"] = [
  { label: "焊接", value: "welding" },
  { label: "打磨", value: "polishing" },
  { label: "组装", value: "assembly" }
];

const buildParameterNode = (
  id: string,
  name: string,
  description: string,
  unit: string,
  value: string,
  children: ParameterNode[] = []
): ParameterNode => ({ id, name, description, unit, value, children });

let parameterConfigs: ParameterConfig[] = [
  {
    id: "1",
    name: "welding_rule_v1",
    type: 1,
    product: products[0].value,
    process: processes[0].value,
    version: "V1.0",
    description: "焊接工艺规则第一版",
    status: 1,
    parameters: [
      buildParameterNode("1-1", "temperature", "焊接温度", "℃", "350"),
      buildParameterNode("1-2", "duration", "焊接时长", "s", "120", [
        buildParameterNode("1-2-1", "preheat", "预热时间", "s", "30"),
        buildParameterNode("1-2-2", "hold", "保压时间", "s", "60"),
        buildParameterNode("1-2-3", "cool", "冷却时间", "s", "30")
      ])
    ]
  },
  {
    id: "2",
    name: "assembly_standard_v2",
    type: 2,
    product: products[1].value,
    process: processes[2].value,
    version: "V2.1",
    description: "装配标准第二版",
    status: 2,
    parameters: [
      buildParameterNode("2-1", "torque", "螺丝扭矩", "N·m", "15"),
      buildParameterNode("2-2", "sequence", "装配顺序", "-", "A-B-C"),
      buildParameterNode("2-3", "inspection", "检验要求", "-", "外观、尺寸")
    ]
  }
];

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
      data: parameterConfigs
    })
  },
  {
    url: "/parameter/configs/:id",
    method: "get",
    response: ({ params }) => {
      const id = typeof params?.id === "string" ? params.id : "";
      const target = parameterConfigs.find(item => item.id === id);
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
      const exists = parameterConfigs.some(item => item.id === payload.id);
      if (exists) {
        return {
          success: false,
          message: "参数配置已存在"
        };
      }
      parameterConfigs = [...parameterConfigs, payload];
      return {
        success: true
      };
    }
  },
  {
    url: "/parameter/configs/:id",
    method: "put",
    response: ({ body, params }) => {
      const id = typeof params?.id === "string" ? params.id : "";
      const payload = body as ParameterConfig;
      parameterConfigs = parameterConfigs.map(item =>
        item.id === id ? { ...payload, id } : item
      );
      return {
        success: true
      };
    }
  },
  {
    url: "/parameter/options",
    method: "get",
    response: () => ({
      success: true,
      data: {
        products,
        processes
      }
    })
  }
  ])
  : [];
