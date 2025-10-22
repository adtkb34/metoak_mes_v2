export default {
  path: "/warehouse",
  name: "Warehouse",
  component: () => import("@/views/warehouse/index.vue"),
  meta: {
    icon: "material-symbols:box-add-outline",
    title: "仓储管理",
    rank: 1
  }
};
