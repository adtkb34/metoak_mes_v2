import { getUserAuth } from "@/utils/auth";

export default {
  path: "/system",
  meta: {
    icon: "uil:setting",
    title: "系统管理",
    authLevel: 1 
  },
  children: getUserAuth().user_level === 1 ? [
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
      path: "/system/skill",
      name: "Skill",
      component: () => import("@/views/skill/index.vue"),
      meta: {
        title: "技能培训",
        showParent: true,
        authLevel: 1
      }
    }
  ] : []
};