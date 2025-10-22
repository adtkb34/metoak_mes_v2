export default {
  path: "/data-analysis",
  component: () => import("@/views/tag/index.vue"),
  meta: {
    icon: "bx:data",
    title: "数据分析"
  },
  children: [] || [
    {
      path: "/data-analysis/oqc",
      name: "OQC",
      component: () => import("@/views/data/oqc.vue"),
      meta: {
        title: "OQC测距退化",
        showParent: true
      }
    },
    {
      path: "/data-analysis/wip",
      name: "WIP",
      component: () => import("@/views/data/wip.vue"),
      meta: {
        title: "WIP测距退化",
        showParent: true
      }
    },
    {
      path: "/data-analysis/spc",
      name: "SPC",
      component: () => import("@/views/data/spc.vue"),
      meta: {
        title: "SPC分析",
        showParent: true
      }
    },
    {
      path: "/data-analysis/cpk",
      name: "CPK",
      component: () => import("@/views/cpk/index.vue"),
      meta: {
        title: "CPK",
        showParent: true
      }
    },
    {
      path: "/data-analysis/fit",
      name: "FIT",
      component: () => import("@/views/cpk/fit.vue"),
      meta: {
        title: "拟合分析",
        showParent: true
      }
    }
  ]
};
