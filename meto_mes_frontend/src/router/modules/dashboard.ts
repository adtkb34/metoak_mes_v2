const Layout = () => import("@/layout/index.vue");

export default {
  path: "/dashboard",
  name: "ProductionDashboard",
  component: Layout,
  redirect: "/dashboard/overview",
  meta: {
    icon: "ri:dashboard-line",
    title: "生产仪表盘",
    rank: 2
  },
  children: [
    {
      path: "/dashboard/overview",
      name: "ProductionDashboardOverview",
      component: () => import("@/views/dashboard/index.vue"),
      meta: {
        title: "生产仪表盘",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
