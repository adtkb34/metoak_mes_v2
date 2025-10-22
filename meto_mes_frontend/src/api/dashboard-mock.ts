import dayjs from "dayjs";
import type {
  DashboardSummaryResponse,
  ProcessDetailData,
  ProcessDetailRow,
  ProcessMetric,
  SelectOption,
  WorkOrderRow
} from "@/views/dashboard/types";
import type {
  DashboardSummaryParams,
  ProcessDetailParams
} from "./dashboard.types";

interface ExtendedProcessMetric extends ProcessMetric {
  products: string[];
  origins: string[];
  lastUpdated: string;
}

const processMetricsSeed: ExtendedProcessMetric[] = [
  {
    id: "AA",
    name: "AA",
    output: 342,
    firstPassYield: 0.945,
    finalYield: 0.982,
    wip: 28,
    trend: 3.2,
    targetOutput: 360,
    products: ["XT-1", "XT-2"],
    origins: ["上海", "苏州"],
    lastUpdated: "2025-01-10"
  },
  {
    id: "calibration",
    name: "标定",
    output: 298,
    firstPassYield: 0.912,
    finalYield: 0.971,
    wip: 35,
    trend: -1.2,
    targetOutput: 310,
    products: ["XT-1", "XT-Pro"],
    origins: ["上海", "深圳"],
    lastUpdated: "2025-01-10"
  },
  {
    id: "final",
    name: "终检",
    output: 276,
    firstPassYield: 0.958,
    finalYield: 0.989,
    wip: 18,
    trend: 0.6,
    targetOutput: 280,
    products: ["XT-1", "XT-2", "XT-Pro"],
    origins: ["苏州", "深圳"],
    lastUpdated: "2025-01-10"
  },
  {
    id: "assembly",
    name: "组装",
    output: 360,
    firstPassYield: 0.905,
    finalYield: 0.965,
    wip: 42,
    trend: 1.8,
    targetOutput: 380,
    products: ["XT-1", "XT-Lite"],
    origins: ["上海", "武汉"],
    lastUpdated: "2025-01-09"
  },
  {
    id: "packaging",
    name: "包装",
    output: 340,
    firstPassYield: 0.978,
    finalYield: 0.995,
    wip: 25,
    trend: 0.4,
    targetOutput: 345,
    products: ["XT-1", "XT-2"],
    origins: ["苏州", "武汉"],
    lastUpdated: "2025-01-09"
  },
  {
    id: "aging",
    name: "老化",
    output: 255,
    firstPassYield: 0.887,
    finalYield: 0.954,
    wip: 55,
    trend: -0.8,
    targetOutput: 270,
    products: ["XT-Pro", "XT-Lite"],
    origins: ["深圳", "武汉"],
    lastUpdated: "2025-01-08"
  }
];

const workOrderSeed: WorkOrderRow[] = [
  {
    orderId: "WO-202501-001",
    description: "XT-1 激光模组",
    expectedQuantity: 600,
    aaPass: 420,
    calibrationPass: 410,
    finalPass: 398,
    product: "XT-1",
    origin: "上海",
    startDate: "2025-01-06",
    dueDate: "2025-01-12"
  },
  {
    orderId: "WO-202501-002",
    description: "XT-Pro 标定批次",
    expectedQuantity: 480,
    aaPass: 300,
    calibrationPass: 288,
    finalPass: 279,
    product: "XT-Pro",
    origin: "深圳",
    startDate: "2025-01-07",
    dueDate: "2025-01-14"
  },
  {
    orderId: "WO-202501-003",
    description: "XT-Lite 试产",
    expectedQuantity: 320,
    aaPass: 180,
    calibrationPass: 174,
    finalPass: 168,
    product: "XT-Lite",
    origin: "武汉",
    startDate: "2025-01-08",
    dueDate: "2025-01-15"
  },
  {
    orderId: "WO-202501-004",
    description: "XT-2 批量订单",
    expectedQuantity: 540,
    aaPass: 350,
    calibrationPass: 340,
    finalPass: 334,
    product: "XT-2",
    origin: "苏州",
    startDate: "2025-01-05",
    dueDate: "2025-01-13"
  },
  {
    orderId: "WO-202501-005",
    description: "XT-1 定制需求",
    expectedQuantity: 260,
    aaPass: 160,
    calibrationPass: 155,
    finalPass: 152,
    product: "XT-1",
    origin: "上海",
    startDate: "2025-01-09",
    dueDate: "2025-01-16"
  }
];

interface ProcessDetailSeed extends Omit<ProcessDetailData, "rows"> {
  rows: ProcessDetailRow[];
}

const processDetailSeed: Record<string, ProcessDetailSeed> = {
  AA: {
    processId: "AA",
    processName: "AA",
    equipmentOptions: [
      { label: "AA-01", value: "AA-01" },
      { label: "AA-02", value: "AA-02" },
      { label: "AA-03", value: "AA-03" }
    ],
    stationOptions: [
      { label: "AA线1", value: "AA线1" },
      { label: "AA线2", value: "AA线2" }
    ],
    rows: [
      {
        id: "AA-20250110-01",
        product: "XT-1",
        origin: "上海",
        batch: "XT1-20250110-A",
        date: "2025-01-10",
        equipment: "AA-01",
        station: "AA线1",
        output: 120,
        firstPassRate: 0.952,
        finalPassRate: 0.985,
        scrapCount: 4,
        reworkCount: 3,
        defects: [
          { reason: "镜头偏移", count: 3 },
          { reason: "螺钉松动", count: 2 }
        ]
      },
      {
        id: "AA-20250110-02",
        product: "XT-2",
        origin: "苏州",
        batch: "XT2-20250110-B",
        date: "2025-01-10",
        equipment: "AA-02",
        station: "AA线2",
        output: 105,
        firstPassRate: 0.938,
        finalPassRate: 0.978,
        scrapCount: 5,
        reworkCount: 4,
        defects: [
          { reason: "光斑偏移", count: 4 },
          { reason: "螺钉松动", count: 3 }
        ]
      },
      {
        id: "AA-20250109-01",
        product: "XT-1",
        origin: "上海",
        batch: "XT1-20250109-A",
        date: "2025-01-09",
        equipment: "AA-03",
        station: "AA线1",
        output: 88,
        firstPassRate: 0.948,
        finalPassRate: 0.983,
        scrapCount: 3,
        reworkCount: 2,
        defects: [
          { reason: "镜头偏移", count: 2 },
          { reason: "胶量不足", count: 2 }
        ]
      },
      {
        id: "AA-20250109-02",
        product: "XT-2",
        origin: "苏州",
        batch: "XT2-20250109-A",
        date: "2025-01-09",
        equipment: "AA-01",
        station: "AA线2",
        output: 96,
        firstPassRate: 0.932,
        finalPassRate: 0.975,
        scrapCount: 6,
        reworkCount: 5,
        defects: [
          { reason: "光轴偏移", count: 5 },
          { reason: "胶量不足", count: 2 }
        ]
      },
      {
        id: "AA-20250108-01",
        product: "XT-1",
        origin: "上海",
        batch: "XT1-20250108-A",
        date: "2025-01-08",
        equipment: "AA-02",
        station: "AA线1",
        output: 110,
        firstPassRate: 0.956,
        finalPassRate: 0.987,
        scrapCount: 4,
        reworkCount: 3,
        defects: [
          { reason: "镜头偏移", count: 3 },
          { reason: "定位销异常", count: 2 }
        ]
      }
    ]
  },
  calibration: {
    processId: "calibration",
    processName: "标定",
    equipmentOptions: [
      { label: "CAL-01", value: "CAL-01" },
      { label: "CAL-02", value: "CAL-02" },
      { label: "CAL-03", value: "CAL-03" }
    ],
    stationOptions: [
      { label: "标定工站1", value: "标定工站1" },
      { label: "标定工站2", value: "标定工站2" }
    ],
    rows: [
      {
        id: "CAL-20250110-01",
        product: "XT-1",
        origin: "上海",
        batch: "XT1-20250110-C",
        date: "2025-01-10",
        equipment: "CAL-01",
        station: "标定工站1",
        output: 98,
        firstPassRate: 0.904,
        finalPassRate: 0.962,
        scrapCount: 7,
        reworkCount: 5,
        defects: [
          { reason: "标定失败", count: 6 },
          { reason: "温漂超限", count: 3 }
        ]
      },
      {
        id: "CAL-20250110-02",
        product: "XT-Pro",
        origin: "深圳",
        batch: "XTP-20250110-A",
        date: "2025-01-10",
        equipment: "CAL-02",
        station: "标定工站2",
        output: 92,
        firstPassRate: 0.916,
        finalPassRate: 0.968,
        scrapCount: 6,
        reworkCount: 4,
        defects: [
          { reason: "温漂超限", count: 5 },
          { reason: "信号异常", count: 3 }
        ]
      },
      {
        id: "CAL-20250109-01",
        product: "XT-1",
        origin: "上海",
        batch: "XT1-20250109-C",
        date: "2025-01-09",
        equipment: "CAL-03",
        station: "标定工站1",
        output: 86,
        firstPassRate: 0.908,
        finalPassRate: 0.963,
        scrapCount: 5,
        reworkCount: 4,
        defects: [
          { reason: "标定失败", count: 4 },
          { reason: "信号异常", count: 2 }
        ]
      },
      {
        id: "CAL-20250109-02",
        product: "XT-Pro",
        origin: "深圳",
        batch: "XTP-20250109-A",
        date: "2025-01-09",
        equipment: "CAL-02",
        station: "标定工站2",
        output: 84,
        firstPassRate: 0.899,
        finalPassRate: 0.957,
        scrapCount: 7,
        reworkCount: 5,
        defects: [
          { reason: "温漂超限", count: 5 },
          { reason: "环境噪声", count: 3 }
        ]
      },
      {
        id: "CAL-20250108-01",
        product: "XT-1",
        origin: "上海",
        batch: "XT1-20250108-C",
        date: "2025-01-08",
        equipment: "CAL-01",
        station: "标定工站1",
        output: 90,
        firstPassRate: 0.921,
        finalPassRate: 0.969,
        scrapCount: 4,
        reworkCount: 3,
        defects: [
          { reason: "信号异常", count: 3 },
          { reason: "标定失败", count: 2 }
        ]
      }
    ]
  },
  final: {
    processId: "final",
    processName: "终检",
    equipmentOptions: [
      { label: "FQC-01", value: "FQC-01" },
      { label: "FQC-02", value: "FQC-02" }
    ],
    stationOptions: [
      { label: "终检台1", value: "终检台1" },
      { label: "终检台2", value: "终检台2" }
    ],
    rows: [
      {
        id: "FQC-20250110-01",
        product: "XT-1",
        origin: "苏州",
        batch: "XT1-20250110-F",
        date: "2025-01-10",
        equipment: "FQC-01",
        station: "终检台1",
        output: 94,
        firstPassRate: 0.966,
        finalPassRate: 0.991,
        scrapCount: 2,
        reworkCount: 2,
        defects: [
          { reason: "功能异常", count: 2 },
          { reason: "外观缺陷", count: 1 }
        ]
      },
      {
        id: "FQC-20250110-02",
        product: "XT-Pro",
        origin: "深圳",
        batch: "XTP-20250110-F",
        date: "2025-01-10",
        equipment: "FQC-02",
        station: "终检台2",
        output: 88,
        firstPassRate: 0.954,
        finalPassRate: 0.986,
        scrapCount: 3,
        reworkCount: 2,
        defects: [
          { reason: "外观缺陷", count: 2 },
          { reason: "性能波动", count: 2 }
        ]
      },
      {
        id: "FQC-20250109-01",
        product: "XT-2",
        origin: "苏州",
        batch: "XT2-20250109-F",
        date: "2025-01-09",
        equipment: "FQC-01",
        station: "终检台1",
        output: 82,
        firstPassRate: 0.962,
        finalPassRate: 0.988,
        scrapCount: 2,
        reworkCount: 1,
        defects: [
          { reason: "功能异常", count: 2 },
          { reason: "外观缺陷", count: 1 }
        ]
      },
      {
        id: "FQC-20250109-02",
        product: "XT-Pro",
        origin: "深圳",
        batch: "XTP-20250109-F",
        date: "2025-01-09",
        equipment: "FQC-02",
        station: "终检台2",
        output: 76,
        firstPassRate: 0.952,
        finalPassRate: 0.985,
        scrapCount: 3,
        reworkCount: 2,
        defects: [
          { reason: "性能波动", count: 2 },
          { reason: "外观缺陷", count: 2 }
        ]
      },
      {
        id: "FQC-20250108-01",
        product: "XT-1",
        origin: "苏州",
        batch: "XT1-20250108-F",
        date: "2025-01-08",
        equipment: "FQC-01",
        station: "终检台1",
        output: 80,
        firstPassRate: 0.968,
        finalPassRate: 0.992,
        scrapCount: 1,
        reworkCount: 1,
        defects: [
          { reason: "功能异常", count: 1 },
          { reason: "外观缺陷", count: 1 }
        ]
      }
    ]
  }
};

function toOptions(values: string[]): SelectOption[] {
  return values.map(value => ({ label: value, value }));
}

function inDateRange(date: string, start?: string, end?: string) {
  if (!start || !end) return true;
  const current = dayjs(date);
  return current.isAfter(dayjs(start).subtract(1, "day")) && current.isBefore(dayjs(end).add(1, "day"));
}

function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

function normalizeOrigins(origins?: string[] | null): string[] {
  return Array.isArray(origins) ? origins : [];
}

export function buildDashboardSummary(
  params: DashboardSummaryParams
): DashboardSummaryResponse {
  const { startDate, endDate } = params;
  const product = params.product ?? null;
  const origins = normalizeOrigins(params.origins);

  const filteredProcesses = processMetricsSeed.filter(item => {
    const matchProduct = !product || item.products.includes(product);
    const matchOrigin = !origins.length || origins.some(origin => item.origins.includes(origin));
    const matchDate = inDateRange(item.lastUpdated, startDate, endDate);
    return matchProduct && matchOrigin && matchDate;
  });

  const filteredWorkOrders = workOrderSeed.filter(item => {
    const matchProduct = !product || item.product === product;
    const matchOrigin = !origins.length || origins.includes(item.origin);
    const matchDate =
      (!startDate || !endDate) ||
      inDateRange(item.startDate, startDate, endDate) ||
      inDateRange(item.dueDate, startDate, endDate);
    return matchProduct && matchOrigin && matchDate;
  });

  const processes: ProcessMetric[] = filteredProcesses.map(item => ({
    id: item.id,
    name: item.name,
    output: item.output,
    firstPassYield: item.firstPassYield,
    finalYield: item.finalYield,
    wip: item.wip,
    trend: item.trend,
    targetOutput: item.targetOutput
  }));

  const productOptions = unique(
    processMetricsSeed.flatMap(item => item.products).concat(filteredWorkOrders.map(order => order.product))
  );
  const originOptions = unique(
    processMetricsSeed.flatMap(item => item.origins).concat(filteredWorkOrders.map(order => order.origin))
  );

  return {
    filters: {
      products: toOptions(productOptions),
      origins: toOptions(originOptions)
    },
    processes,
    workOrders: filteredWorkOrders
  };
}

export function buildProcessDetail(
  params: ProcessDetailParams
): ProcessDetailData {
  const base = processDetailSeed[params.processId];
  if (!base) {
    throw new Error("未找到对应的工序数据");
  }

  const product = params.product ?? null;
  const origins = normalizeOrigins(params.origins);

  let rows = base.rows.filter(row => {
    const matchProduct = !product || row.product === product;
    const matchOrigin = !origins.length || origins.includes(row.origin);
    const matchDate = inDateRange(row.date, params.startDate, params.endDate);
    return matchProduct && matchOrigin && matchDate;
  });

  if (!rows.length) {
    rows = [];
  }

  const equipmentOptions = toOptions(unique(rows.map(row => row.equipment)));
  const stationOptions = toOptions(unique(rows.map(row => row.station)));

  return {
    processId: base.processId,
    processName: base.processName,
    equipmentOptions,
    stationOptions,
    rows
  };
}

