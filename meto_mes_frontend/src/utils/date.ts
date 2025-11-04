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
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    return typeof input === "string" ? input : "";
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}
