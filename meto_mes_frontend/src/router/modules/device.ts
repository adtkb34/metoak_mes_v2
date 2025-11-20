export default {
  path: "/device",
  meta: {
    icon: "material-symbols:devices-outline",
    title: "设备管理",
    rank: 1
  },
  children: [
    {
      path: "/device/efficiency",
      name: "DeviceEfficiency",
      component: () => import("@/views/device/efficiency/index.vue"),
      meta: {
        title: "效率统计",
        showParent: true
      }
    }
  ]
};
