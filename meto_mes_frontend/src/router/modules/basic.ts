export default {
  path: "/basic",
  name: "basic",
  meta: {
    icon: "ep:data-analysis",
    title: "生产管理"
  },
  children: [
    {
      path: "/order",
      name: "order",
      component: () => import("@/views/produce-order/manage/index.vue"),
      meta: {
        title: "工单管理",
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
    },
    {
      path: "/basic/process-flow",
      name: "ProcessFlow",
      component: () => import("@/views/process-flow/index.vue"),
      meta: {
        title: "工艺流程",
        showParent: true
      }
    }
  ]
};
