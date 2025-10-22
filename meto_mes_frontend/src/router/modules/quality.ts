// export default {
//   path: "/quality",
//   name: "Quality",
//   component: () => import("@/views/quality/analysis/index.vue"),
//   meta: {
//     icon: "heroicons:cpu-chip",
//     title: "品质管理",
//     rank: 1
//   }
// };


export default {
  path: "/statistics",
  meta: {
    icon: "heroicons:cpu-chip",
    title: "数据统计",
    rank: 1
  },
  children: [
    {
      path: "/statistics/quality-v2",
      name: "QualityV2",
      component: () => import("@/views/quality/analysis-v2/index.vue"),
      meta: {
        title: "工序产量统计",
        showParent: true,
      }
    },
    {
      path: "/statistics/quality",
      name: "Quality",
      component: () => import("@/views/quality/analysis/index.vue"),
      meta: {
        title: "品质管理",
        showParent: true,
      }
    },
    {
      path: "/statistics/measure-distance",
      name: "measure-distance",
      component: () => import("@/views/quality/measure-distance/index.vue"),
      meta: {
        title: "测距分析",
        showParent: true,
      }
    },
    {
      path: "/statistics/stereo-calibration",
      name: "stereo-calibration",
      component: () => import("@/views/quality/stereo-calibration/index.vue"),
      meta: {
        title: "双目标定",
        showParent: true,
      }
    },
    {
      path: "/statistics/stereo-precheck",
      name: "stereo-precheck",
      component: () => import("@/views/quality/stereo-precheck/index.vue"),
      meta: {
        title: "316L",
        showParent: true,
      }
    },
    {
      path: "/statistics/final_check",
      name: "final-check",
      component: () => import("@/views/m55h/index.vue"),
      meta: {
        title: "M55H 单目终测",
        showParent: true,
      }
    },
    {
      path: "/statistics/others",
      name: "others",
      component: () => import("@/views/quality/table-others/index.vue"),
      meta: {
        title: "其他工序",
        showParent: true,
      }
    }
  ]
};