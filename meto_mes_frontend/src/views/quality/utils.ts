import type { NormalizedItemWithDesc } from "types/quality";

export function normalizeData(input): NormalizedItemWithDesc[] {
  const result: NormalizedItemWithDesc[] = [];

  for (const key in input) {
    const list = input[key];
    list.forEach(item => {
      const camera_sn = item.camera_sn ?? item.beam_sn;
      if (camera_sn) {
        result.push({ camera_sn, ...item });
      }
    });
  }

  return result;
}

type SortedType = { value: number; name: string };

export function sortData(input: NormalizedItemWithDesc[]): SortedType[] {
  const result = {};
  for (const { description } of input) {
    result[description] = (result[description] || 0) + 1;
  }
  const sortedData = Object.entries(result)
    .map(([key, value]) => ({
      value: value as number,
      name: key
    }))
    .sort((a, b) => a.value - b.value);

  return sortedData.slice(0, 10);
}

export function formatDateToYMDHMS(dateInput) {
  if (!dateInput) return ''

  const date = new Date(dateInput) // 可以是字符串/Date
  if (isNaN(date.getTime())) return '' // 非法日期

  const pad = n => String(n).padStart(2, '0')

  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const h = pad(date.getHours())
  const min = pad(date.getMinutes())
  const s = pad(date.getSeconds())

  return `${y}-${m}-${d} ${h}:${min}:${s}`
}
