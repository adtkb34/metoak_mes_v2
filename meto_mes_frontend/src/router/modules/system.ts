import { getUserAuth } from "@/utils/auth";

export default {
  path: "/system",
  meta: {
    icon: "uil:setting",
    title: "系统管理",
    authLevel: 1
  },
  children: [
    // {
    //   path: "/system/parameter-configs",
    //   name: "ParameterConfigs",
    //   component: () => import("@/views/system/parameter/index.vue"),
    //   meta: {
    //     title: "参数管理",
    //     showParent: true,
    //     authLevel: 1
    //   }
    // },
    // {
    //   path: "/system/parameter-configs/new",
    //   name: "ParameterConfigCreate",
    //   component: () => import("@/views/system/parameter/ParameterForm.vue"),
    //   meta: {
    //     title: "新增参数配置",
    //     showLink: false,
    //     activeMenu: "/system/parameter-configs",
    //     authLevel: 1
    //   }
    // },
    // {
    //   path: "/system/parameter-configs/:id",
    //   name: "ParameterConfigEdit",
    //   component: () => import("@/views/system/parameter/ParameterForm.vue"),
    //   meta: {
    //     title: "编辑参数配置",
    //     showLink: false,
    //     activeMenu: "/system/parameter-configs",
    //     authLevel: 1
    //   }
    // },
    {
      path: "/system/users",
      name: "Users",
      component: () => import("@/views/system/user/index.vue"),
      meta: {
        title: "用户管理",
        showParent: true,
        authLevel: 1
      }
    },
    {
      path: "/system/version-info",
      name: "VersionInfo",
      component: () => import("@/views/system/version/index.vue"),
      meta: {
        title: "版本信息",
        showParent: true,
        authLevel: 1
      }
    }
    // {
    //   path: "/system/skill",
    //   name: "Skill",
    //   component: () => import("@/views/skill/index.vue"),
    //   meta: {
    //     title: "技能培训",
    //     showParent: true,
    //     authLevel: 1
    //   }
    // }
  ]
};
