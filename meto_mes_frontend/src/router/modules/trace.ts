export default {
  path: "/trace",
  name: "Traceability",
  component: () => import("@/views/traceability/index.vue"),
  meta: {
    icon: "oui:apm-trace",
    title: "产品追溯",
    rank: 1
  }
};
