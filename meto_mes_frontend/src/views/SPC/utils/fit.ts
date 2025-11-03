export function fitNormal(data: number[]) {
  if (data.length === 0) return { x: [], y: [], mean: 0, std: 1 };

  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const std = Math.sqrt(data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / data.length);
  const x = Array.from({ length: 100 }, (_, i) => mean - 3 * std + (i * 6 * std) / 99);
  const y = x.map(val => (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((val - mean) / std) ** 2));
  return { x, y, mean, std };
}

export function fitLinear(data: number[]) {
  if (data.length === 0) {
    data = [0]
  }
  const x = data.map((_, i) => i);
  const y = data;
  const n = x.length;
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  const b = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0) /
            x.reduce((sum, xi) => sum + (xi - xMean) ** 2, 0);
  const a = yMean - b * xMean;
  const predicted = x.map(xi => a + b * xi);
  return { x, y, a, b, predicted };
}

// 改进的正态性检验（基于 Shapiro–Wilk 统计量近似公式）
export function testNormality(data: number[]) {
  const n = data.length;
  if (n < 3) return { p: 1, isNormal: true };

  // 1. 排序
  const sorted = [...data].sort((a, b) => a - b);

  // 2. 计算均值、方差
  const mean = sorted.reduce((s, x) => s + x, 0) / n;
  const s2 = sorted.reduce((s, x) => s + (x - mean) ** 2, 0);

  // 3. 计算正态分布理论分位数
  const m = [];
  for (let i = 0; i < n; i++) {
    const p = (i + 1 - 0.375) / (n + 0.25);
    // probit: Φ⁻¹(p)，使用近似公式
    m.push(Math.sqrt(2) * inverseErf(2 * p - 1));
  }

  // 4. 计算权重系数 a_i
  const c = m.map((x) => x - meanOf(m));
  const c2 = Math.sqrt(c.reduce((s, x) => s + x ** 2, 0));
  const a = c.map((x) => x / c2);

  // 5. 计算 W 统计量
  const numerator = Math.pow(
    a.reduce((s, ai, i) => s + ai * sorted[i], 0),
    2
  );
  const denominator = s2;
  const W = numerator / denominator;

  // 6. p 值近似（经验公式）
  const ln1mW = Math.log(1 - W);
  const mu = -1.2725 + 1.0521 * (Math.log(n));
  const sigma = 1.0308 - 0.26758 * (Math.log(n));
  const z = (ln1mW - mu) / sigma;
  const p = 1 - normalCDF(z);

  return { p, isNormal: p > 0.05, W };
}

// --- 辅助函数 ---

function meanOf(arr: number[]) {
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

function normalCDF(z: number) {
  return (1 + erf(z / Math.sqrt(2))) / 2;
}

function erf(x: number) {
  // 数值近似误差函数
  const sign = Math.sign(x);
  const a1 = 0.278393;
  const a2 = 0.230389;
  const a3 = 0.000972;
  const a4 = 0.078108;
  const t = 1 / (1 + a1 * Math.abs(x) + a2 * x ** 2 + a3 * x ** 3 + a4 * x ** 4);
  return sign * (1 - t ** 4);
}

function inverseErf(x: number) {
  // 近似求 Φ⁻¹(p) = sqrt(2) * inverseErf(2p - 1)
  const a = 0.147;
  const ln = Math.log(1 - x ** 2);
  const part1 = (2 / (Math.PI * a)) + ln / 2;
  const part2 = Math.sqrt(part1 ** 2 - ln / a);
  return Math.sign(x) * Math.sqrt(part2 - part1);
}

