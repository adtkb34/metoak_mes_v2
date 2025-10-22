/**
 * 将整数表示的规则掩码转换为 ['rule_1', 'rule_2', ...]
 * @param mask 数值掩码
 * @returns string[]
 */
export function maskToRules(mask: number): string[] {
  const rules: string[] = [];
  let index = 1;

  while (mask > 0) {
    if (mask & 1) {
      rules.push(`rule_${index}`);
    }
    mask >>= 1;
    index++;
  }

  return rules;
}

/**
 * 将 ['rule_1', 'rule_2', ...] 转换为 2^(n-1)+... 
 * @param rules 规则数组
 * @returns number
 */
export function rulesToValue(rules) {
  return rules.reduce((sum, rule) => {
    const match = rule.match(/rule_(\d+)/);
    if (!match) return sum;
    const n = parseInt(match[1], 10);
    return sum + Math.pow(2, n - 1);
  }, 0);
}
