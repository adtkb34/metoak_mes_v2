import type {
  ParameterConfig,
  ParameterNode,
  ParameterOptions
} from "types/parameter";

type OperationResult = {
  success: boolean;
  message?: string;
};

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const productOptions: ParameterOptions["products"] = [
  { label: "产品A", value: "product_a" },
  { label: "产品B", value: "product_b" },
  { label: "产品C", value: "product_c" }
];

const processOptions: ParameterOptions["processes"] = [
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

const initialParameterConfigs: ParameterConfig[] = [
  {
    id: "1",
    name: "welding_rule_v1",
    type: 1,
    product: productOptions[0].value,
    process: processOptions[0].value,
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
    product: productOptions[1].value,
    process: processOptions[2].value,
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

let parameterConfigsStore: ParameterConfig[] = deepClone(
  initialParameterConfigs
);

export const resetParameterMockData = () => {
  parameterConfigsStore = deepClone(initialParameterConfigs);
};

export const getParameterMockOptions = (): ParameterOptions => ({
  products: deepClone(productOptions),
  processes: deepClone(processOptions)
});

export const listParameterMockConfigs = (): ParameterConfig[] =>
  deepClone(parameterConfigsStore);

export const getParameterMockConfig = (
  id: string
): ParameterConfig | undefined => {
  const target = parameterConfigsStore.find(item => item.id === id);
  return target ? deepClone(target) : undefined;
};

export const addParameterMockConfig = (
  payload: ParameterConfig
): OperationResult => {
  const exists = parameterConfigsStore.some(item => item.id === payload.id);
  if (exists) {
    return {
      success: false,
      message: "参数配置已存在"
    };
  }
  parameterConfigsStore = [...parameterConfigsStore, deepClone(payload)];
  return { success: true };
};

export const updateParameterMockConfig = (
  id: string,
  payload: ParameterConfig
): OperationResult => {
  const index = parameterConfigsStore.findIndex(item => item.id === id);
  if (index < 0) {
    return {
      success: false,
      message: "未找到参数配置"
    };
  }
  const next = deepClone({ ...payload, id });
  parameterConfigsStore = parameterConfigsStore.map((item, idx) =>
    idx === index ? next : item
  );
  return { success: true };
};
