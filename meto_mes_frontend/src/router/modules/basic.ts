export default {
  path: "/basic",
  name: "basic",
  meta: {
    icon: "ep:data-analysis",
    title: "基本信息"
  },
  children: [
    {
      path: "/basic/process-flow",
      name: "ProcessFlow",
      component: () => import("@/views/process-flow/index.vue"),
      meta: {
        title: "工艺流程",
        showParent: true
      }
    },
    {
      path: "/basic/process-management",
      name: "ProcessManagement",
      component: () => import("@/views/process-flow/management.vue"),
      meta: {
        title: "工序管理",
        showParent: true
      }
    }
  ]
};
