export default {
  path: "/trace",
  name: "Trace",
  component: () => import("@/views/trace/index.vue"),
  meta: {
    icon: "oui:apm-trace",
    title: "产品追溯",
    rank: 1
  }
};
