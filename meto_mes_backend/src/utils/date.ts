export function formatToLocal(isoString: string): string {
  if (!isoString) return "";

  // 去掉纳秒部分（只保留毫秒）
  const normalized = isoString.replace(/(\.\d{3})\d+Z$/, "$1Z");

  const date = new Date(normalized);
  if (isNaN(date.getTime())) return isoString; // 无法解析就原样返回

  // 转换成本地字符串（yyyy-MM-dd HH:mm:ss）
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
       + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
