export default {
  path: "/production-screen",
  name: "ProductionScreen",
  component: () => import("@/views/dashboard/production-screen.vue"),
  meta: {
    title: "生产酷炫大屏",
    showLink: false,
    rank: 1
  }
} satisfies RouteConfigsTable;
