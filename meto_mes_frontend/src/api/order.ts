import { getUserAuth } from "@/utils/auth";
import { http } from "@/utils/http";

export interface OrderInfo {
  work_order_code: string;
  order_date: Date;
  material_code: string;
  material_name: string;
  completed_count: number;
  model_type: string;
  produce_count: number;
  produce_unit: string;
  planned_starttime: string;
  planned_endtime: string;
  flow_code: string;
}

export interface MaterialsInfo {
  material_code: string;
  material_name: string;
}

export async function getAllMaterilsFromK3(): Promise<MaterialsInfo> {
  return http.request("get", "/k3cloud/materials");
  // const res = await http.request("get", "/k3cloud/prd-mo");
  // return res.data;
}

export async function getAllOrders(): Promise<OrderInfo> {
  return http.request("get", "/production-management/produce-orders");
  // const res = await http.request("get", "/k3cloud/prd-mo");
  // return res.data;
}

export function createOrder(data: OrderInfo): Promise<OrderInfo> {
  return http.request("post", `/production-management/produce-order?user_level=${getUserAuth().user_level}`, { data });
}

export function deleteOrder(order_code: string) {
  return http.request("delete", "/production-management/produce-order", {
    params: {
      user_level: getUserAuth().user_level,
      order_code
    }
  });
}

export function updateOrder(data: OrderInfo): Promise<OrderInfo> {
  return http.request("patch", "/production-management/produce-order", {
    params: {
      user_level: getUserAuth().user_level,
      order_code: data.work_order_code
    },
    data
  });
}
