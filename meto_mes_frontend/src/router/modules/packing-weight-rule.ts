import { PACKING_WEIGHT_RULE_ROUTE_TITLE } from "@/views/warehouse/packing-weight-rule/packingWeightRule.constants";

const PACKING_WEIGHT_RULE_ROUTE_PATH = "/warehouse/packing-weight-rules";
const PACKING_WEIGHT_RULE_ROUTE_NAME = "PackingWeightRule";
const PACKING_WEIGHT_RULE_MENU_ICON = "mdi:weight-kilogram";
const PACKING_WEIGHT_RULE_CHILD_PATH = "/warehouse/packing-weight-rules/list";
const PACKING_WEIGHT_RULE_PARENT_TITLE = "装箱管理";

export default {
  path: PACKING_WEIGHT_RULE_ROUTE_PATH,
  name: PACKING_WEIGHT_RULE_ROUTE_NAME,
  component: () => import("@/layout/index.vue"),
  meta: {
    icon: PACKING_WEIGHT_RULE_MENU_ICON,
    title: PACKING_WEIGHT_RULE_PARENT_TITLE
  },
  children: [
    {
      path: PACKING_WEIGHT_RULE_CHILD_PATH,
      name: `${PACKING_WEIGHT_RULE_ROUTE_NAME}List`,
      component: () =>
        import("@/views/warehouse/packing-weight-rule/index.vue"),
      meta: {
        title: PACKING_WEIGHT_RULE_ROUTE_TITLE,
        showParent: true
      }
    }
  ]
};
