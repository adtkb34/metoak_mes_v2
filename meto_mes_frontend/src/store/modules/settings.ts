import { defineStore } from "pinia";
import { type setType, store, getConfig } from "../utils";
import { generateTitleByRegion } from "@/utils/title";

export const useSettingStore = defineStore({
  id: "pure-setting",
  state: (): setType => {
    const configTitle = getConfig().Title;
    // 如果配置中没有标题，则根据地区生成标题
    const title = configTitle || generateTitleByRegion();

    return {
      title: title,
      fixedHeader: getConfig().FixedHeader,
      hiddenSideBar: getConfig().HiddenSideBar
    };
  },
  getters: {
    getTitle(state) {
      return state.title;
    },
    getFixedHeader(state) {
      return state.fixedHeader;
    },
    getHiddenSideBar(state) {
      return state.hiddenSideBar;
    }
  },
  actions: {
    CHANGE_SETTING({ key, value }) {
      if (Reflect.has(this, key)) {
        this[key] = value;
      }
    },
    changeSetting(data) {
      this.CHANGE_SETTING(data);
    }
  }
});

export function useSettingStoreHook() {
  return useSettingStore(store);
}