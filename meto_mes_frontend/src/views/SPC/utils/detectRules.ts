/**
 * 规则1：单点超出控制上限或下限
 */
export function detectRule1(data: number[], usl: number, lsl: number): number[] {
  return data.map((v, i) => (v > usl || v < lsl ? i : -1)).filter(i => i >= 0);
}

/**
 * 规则2：6个点持续上升或下降（趋势）
 */
export function detectRule2(data: number[]): number[] {
  const result: number[] = [];
  for (let i = 0; i <= data.length - 6; i++) {
    const slice = data.slice(i, i + 6);
    const increasing = slice.every((v, j, a) => j === 0 || a[j] > a[j - 1]);
    const decreasing = slice.every((v, j, a) => j === 0 || a[j] < a[j - 1]);
    if (increasing || decreasing) {
      result.push(...Array.from({ length: 6 }, (_, k) => i + k));
      i += 5; // 防止重复判定重叠区段
    }
  }
  return result;
}

/**
 * 规则3（Western Electric Rule）：连续9个点在中心线同一侧（全部大于或全部小于）
 */
export function detectRule3(data: number[], mean: number): number[] {
  const result: number[] = [];
  let i = 0;
  const n = data.length;

  while (i < n) {
    // 判断当前是在哪一侧
    const isAbove = data[i] > mean;
    let j = i;

    // 向后扩展直到不是同一侧
    while (
      j < n &&
      ((isAbove && data[j] > mean) || (!isAbove && data[j] < mean))
    ) {
      j++;
    }

    const count = j - i;
    if (count >= 9) {
      for (let k = i; k < j; k++) {
        result.push(k);
      }
    }

    // 移动到下一段
    i = j;
  }

  return result;
}

/**
 * 规则4：14个点交替上下波动
 */
export function detectRule4(data: number[]): number[] {
  const result: number[] = [];
  for (let i = 0; i <= data.length - 14; i++) {
    let isAlternating = true;
    for (let j = 2; j < 14; j++) {
      const diff1 = data[i + j - 1] - data[i + j - 2];
      const diff2 = data[i + j] - data[i + j - 1];
      if (diff1 * diff2 >= 0) {
        isAlternating = false;
        break;
      }
    }
    if (isAlternating) {
      result.push(...Array.from({ length: 14 }, (_, k) => i + k));
      i += 13;
    }
  }
  return result;
}

/**
 * 规则5：连续2个点中有一个落在均值±2σ以外（不同侧不要求）
 */
export function detectRule5(data: number[], mean: number, std: number): number[] {
  const result: number[] = [];
  for (let i = 0; i <= data.length - 2; i++) {
    const slice = data.slice(i, i + 2);
    if (slice.filter(v => Math.abs(v - mean) > 2 * std).length >= 2) {
      result.push(i, i + 1);
      i += 1;
    }
  }
  return result;
}

/**
 * 规则6：连续3个点中有2个落在均值±1σ之外（同一侧）
 */
export function detectRule6(data: number[], mean: number, std: number): number[] {
  const result: number[] = [];
  for (let i = 0; i <= data.length - 3; i++) {
    const group = data.slice(i, i + 3);
    const over1std = group.map(v => v - mean).filter(diff => Math.abs(diff) > std);
    const sameSide = over1std.every(d => d > 0) || over1std.every(d => d < 0);
    if (over1std.length >= 2 && sameSide) {
      result.push(i, i + 1, i + 2);
      i += 2;
    }
  }
  return result;
}

/**
 * 规则7：连续15个点全部落在 ±1σ 之内（过于集中）
 */
export function detectRule7(data: number[], mean: number, std: number): number[] {
  const result: number[] = [];
  for (let i = 0; i <= data.length - 15; i++) {
    const group = data.slice(i, i + 15);
    if (group.every(v => Math.abs(v - mean) < std)) {
      result.push(...Array.from({ length: 15 }, (_, k) => i + k));
      i += 14;
    }
  }
  return result;
}

/**
 * 规则8：连续8个点全部落在 ±1σ 之外（远离中心线）
 */
export function detectRule8(data: number[], mean: number, std: number): number[] {
  const result: number[] = [];
  for (let i = 0; i <= data.length - 8; i++) {
    const group = data.slice(i, i + 8);
    const outOf1sigma = group.map(v => v - mean).filter(d => Math.abs(d) > std);
    const sameSide = outOf1sigma.every(d => d > 0) || outOf1sigma.every(d => d < 0);
    if (outOf1sigma.length === 8 && sameSide) {
      result.push(...Array.from({ length: 8 }, (_, k) => i + k));
      i += 7;
    }
  }
  return result;
}
