import { defineStore } from "pinia";
import type { UserInfo } from "types/system";
import { getUserList } from "@/api/system";

export const useUserListStore = defineStore("userInfo", {
  state: () => ({
    userList: null as Array<UserInfo> | null,
    user: {
      username: "",
      user_level: 10
    }
  }),

  getters: {
    userList: state => state,
    getUsername: state => localStorage.getItem("username"),
    getUserLevel: state => Number(localStorage.getItem("user_level"))
  },

  actions: {
    async setUserList() {
      this.userList = await getUserList();
    },

    clearUserList() {
      this.user.userList = null;
    },

    setUsername(username) {
      this.user.username = username;
    },

    setUserLevel(user_level) {
      this.user.user_level = user_level;
    }
  }
});
