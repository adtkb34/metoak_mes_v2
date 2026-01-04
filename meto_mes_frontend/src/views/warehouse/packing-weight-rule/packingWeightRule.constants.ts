export const PACKING_WEIGHT_RULE_ROUTE_TITLE = "装箱重量规则";
export const PACKING_WEIGHT_RULE_PAGE_TITLE = "装箱重量规则";
export const PACKING_WEIGHT_RULE_CARD_HEADER = "装箱重量规则清单";
export const PACKING_WEIGHT_RULE_CREATE_LABEL = "新增规则";
export const PACKING_WEIGHT_RULE_EDIT_LABEL = "编辑";
export const PACKING_WEIGHT_RULE_DIALOG_TITLE = {
  create: "新建装箱重量规则",
  update: "更新装箱重量规则"
} as const;
export const PACKING_WEIGHT_RULE_SUBMIT_LABEL = "保存";
export const PACKING_WEIGHT_RULE_CANCEL_LABEL = "取消";
export const PACKING_WEIGHT_RULE_UNIT_LABEL = "重量单位";
export const PACKING_WEIGHT_RULE_PRODUCT_CODE_LABEL = "产品编码";
export const PACKING_WEIGHT_RULE_FULL_BOX_QUANTITY_LABEL = "满箱数量";
export const PACKING_WEIGHT_RULE_SINGLE_WEIGHT_LABEL = "单个产品重量";
export const PACKING_WEIGHT_RULE_PACKAGE_WEIGHT_LABEL = "整箱包装重量";
export const PACKING_WEIGHT_RULE_ALLOWED_DEVIATION_LABEL = "允许偏差";
export const PACKING_WEIGHT_RULE_CREATED_AT_LABEL = "创建时间";
export const PACKING_WEIGHT_RULE_UPDATED_AT_LABEL = "更新时间";
export const PACKING_WEIGHT_RULE_ACTIONS_LABEL = "操作";
export const PACKING_WEIGHT_RULE_FORM_MODE = {
  create: "create",
  update: "update"
} as const;
export const PACKING_WEIGHT_RULE_UNIT_OPTIONS = [
  { label: "kg", value: "kg" },
  { label: "g", value: "g" }
] as const;
export const PACKING_WEIGHT_RULE_FORM_WIDTH = "560px";
export const PACKING_WEIGHT_RULE_FORM_LABEL_WIDTH = "120px";
export const PACKING_WEIGHT_RULE_NUMBER_MIN = 0;
export const PACKING_WEIGHT_RULE_NUMBER_STEP = 0.001;
export const PACKING_WEIGHT_RULE_NUMBER_PRECISION = 3;
export const PACKING_WEIGHT_RULE_TABLE_HEIGHT = "600px";
export const PACKING_WEIGHT_RULE_LAYOUT_GAP = 12;
export const PACKING_WEIGHT_RULE_PADDING = 12;
export const PACKING_WEIGHT_RULE_INDEX_COLUMN_WIDTH = 60;
export const PACKING_WEIGHT_RULE_ACTION_COLUMN_WIDTH = 120;
export const PACKING_WEIGHT_RULE_API_BASE =
  "/api/mes/v1/packing/weight-rules";
export const PACKING_WEIGHT_RULE_MESSAGE = {
  loadFailed: "装箱重量规则获取失败",
  createFailed: "装箱重量规则创建失败",
  createSuccess: "装箱重量规则创建成功",
  updateFailed: "装箱重量规则更新失败",
  updateSuccess: "装箱重量规则更新成功",
  submitFailed: "请完善装箱重量规则信息"
} as const;
