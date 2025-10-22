export default {
  path: '/spc',
  name: "SPC",
  meta: {
    icon: "akar-icons:statistic-up",
    title: "SPC分析",
  },
  children: [
    // {
    //   path: "/spc/dashboard",
    //   name: "Dashboard",
    //   component: () => import("@/views/SPC/Dashboard.vue"),
    //   meta: {
    //     title: "数据大屏",
    //   }
    // },
    {
      path: "/spc/graph",
      name: "SPCGraph",
      component: () => import("@/views/SPC/SpcChartPage.vue"),
      meta: {
        title: "控制图",
      }
    },
    {
      path: "/spc/fit",
      name: "SPCFit",
      component: () => import("@/views/SPC/FitAnalysisPage.vue"),
      meta: {
        title: "拟合分析",
      }
    },
    {
      path: "/spc/cpk",
      name: "cpk",
      component: () => import("@/views/SPC/CpkAnalysisPage.vue"),
      meta: {
        title: "CPK分析",
      }
    },
  ]
};
