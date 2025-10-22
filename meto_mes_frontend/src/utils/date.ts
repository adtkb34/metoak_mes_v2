import type { Ref } from "vue";

export type DateRangeRef = Ref<[Date, Date]>;
export type DateRangeString = [string, string];

export function isDateEmpty(date: DateRangeRef): boolean {
  return (
    date.value === null || date.value[0] === null || date.value[1] === null
  );
}

export function useDateToString(date: DateRangeRef): DateRangeString {
  return [date.value[0].toString(), date.value[1].toString()];
}

export function formatToUTC8(input: string | number | Date): string {
  const date = new Date(input);
  // 获取 UTC 时间戳 + 8 小时偏移（毫秒）
  const localDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    `${localDate.getUTCFullYear()}-${pad(localDate.getUTCMonth() + 1)}-${pad(localDate.getUTCDate())} ` +
    `${pad(localDate.getUTCHours())}:${pad(localDate.getUTCMinutes())}:${pad(localDate.getUTCSeconds())}`
  );
}
