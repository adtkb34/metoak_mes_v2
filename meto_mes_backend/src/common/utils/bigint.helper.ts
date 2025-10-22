export function bigintToString(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(bigintToString);
  } else if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = bigintToString(obj[key]);
    }
    return result;
  } else if (typeof obj === 'bigint') {
    return obj.toString();
  } else {
    return obj;
  }
}
