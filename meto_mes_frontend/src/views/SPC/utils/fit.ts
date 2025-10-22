export function fitNormal(data: number[]) {
  if (data.length === 0) return { x: [], y: [], mean: 0, std: 1 };

  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const std = Math.sqrt(data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / data.length);
  const x = Array.from({ length: 100 }, (_, i) => mean - 3 * std + (i * 6 * std) / 99);
  const y = x.map(val => (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((val - mean) / std) ** 2));
  return { x, y, mean, std };
}

export function fitLinear(data: number[]) {
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
