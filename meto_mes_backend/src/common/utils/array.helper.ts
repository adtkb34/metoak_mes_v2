// src/common/utils/array.helper.ts

/**
 * 按字段分组
 * groupBy([{id: 1, type: 'a'}, {id: 2, type: 'b'}], 'type') =>
 * { a: [{...}], b: [{...}] }
 */
export function groupBy<T>(list: T[], key: keyof T): Record<string, T[]> {
  return list.reduce(
    (acc, item) => {
      const groupKey = String(item[key]);
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

/**
 * 数组去重（默认对整个对象做 JSON.stringify 对比）
 * 可传入 selector 自定义字段去重
 */
export function uniqueBy<T>(list: T[], selector?: (item: T) => any): T[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    const key = JSON.stringify(selector ? selector(item) : item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 分页切片
 */
export function paginate<T>(list: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

/**
 * 每组保留前 N 条（按某字段分组 + 排序）
 */
export function topNPerGroup<T>(
  list: T[],
  groupKey: keyof T,
  sortKey: keyof T,
  n: number,
  descending = true,
): T[] {
  const grouped = groupBy(list, groupKey);
  const result: T[] = [];

  for (const group of Object.values(grouped)) {
    const sorted = group.sort((a, b) => {
      const aVal = a[sortKey] as any;
      const bVal = b[sortKey] as any;
      return descending ? bVal - aVal : aVal - bVal;
    });
    result.push(...sorted.slice(0, n));
  }

  return result;
}
