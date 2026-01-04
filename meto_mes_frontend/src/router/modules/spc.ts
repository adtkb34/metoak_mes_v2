export default {
  path: '/spc',
  name: "SPC",
  meta: {
    icon: "akar-icons:statistic-up",
    title: "SPC分析",
  },
  component: () => import("@/views/SPC/SpcChartPage.vue"),
};
