import { dateType } from "@pureadmin/utils";

export interface UserInfo {
  user_name: string
  user_password?: string
  user_level?: number
  work_code?: string
  real_name?: string
  create_time?: string
  user_state?: number
}