import { http } from "@/utils/http";
import { UserInfo } from "types/system";

export function getUserList() {
  return http.request<Array<UserInfo>>('get', '/user')
}

export function createUser(data: any) {
  console.log(data);

  return http.request('post', '/user', { data })
}

export function updateUser(user_name: string, data: any) {
  return http.request('put', `/user/${user_name}`, { data })
}

export function deleteUserByName(user_name: string) {
  return http.request('delete', `/user/${user_name}`)
}

export function resetUserPassword(user_name: string) {
  return http.request('put', `/user/${user_name}`, { data: { user_password: '123456' } })
}
