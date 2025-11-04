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
  if (input == null || input === "") return "";

  // --- 1️⃣ 预处理字符串 ---
  if (typeof input === "string") {
    const normalized = input.trim();
    if (!normalized) return "";

    const isoLikeMatch = normalized.match(
      /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/i
    );
    if (isoLikeMatch) {
      const [, year, month, day, hour, minute, second] = isoLikeMatch;
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
  }

  // --- 2️⃣ 统一转为 Date ---
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    return typeof input === "string" ? input : "";
  }

  // --- 3️⃣ 使用 UTC 方法取值，彻底避免时区偏移 ---
  const pad = (n: number) => n.toString().padStart(2, "0");

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hour = pad(date.getUTCHours());
  const minute = pad(date.getUTCMinutes());
  const second = pad(date.getUTCSeconds());

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
