/**
 * 将一维数据按子组大小分组（返回二维数组）
 * @param data 一维原始数据
 * @param groupSize 每组的样本数
 * @returns 二维数组，如 [[329, 330, 331], [328, 327, 326], ...]
 */
export function splitIntoSubgroups(data: number[], groupSize: number): number[][] {
  if (groupSize <= 1) return [];

  const groups: number[][] = [];
  for (let i = 0; i + groupSize <= data.length; i += groupSize) {
    groups.push(data.slice(i, i + groupSize));
  }
  return groups;
}
