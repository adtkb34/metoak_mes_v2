import type { OrderListItem } from "types/tag";

export function spliceFields(order: OrderListItem) {
  return `${order.work_order_code} ( ${order.material_name} - ${order.material_code} )`;
}

export function getYearCode(year: number, baseYear = 2023): string {
  const offset = year - baseYear;
  const code = String.fromCharCode("A".charCodeAt(0) + offset);
  return code;
}

export function getCurrentYearCode() {
  const currentYear = new Date().getFullYear();
  return getYearCode(currentYear);
}

export function exportToCSV(data: any[], filename = "export.csv") {
  if (!data.length) return;

  const keys = Object.keys(data[0]);
  const csvRows = [
    keys.join(","), // 表头
    ...data.map(row => keys.map(k => `"${row[k]}"`).join(",")) // 每行
  ];

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
