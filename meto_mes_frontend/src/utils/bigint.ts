/**
 * 处理BigInt类型数据的工具函数
 */

/**
 * 将可能包含BigInt的响应数据转换为可序列化的格式
 * @param data 包含BigInt的数据
 * @returns 转换后的数据
 */
export function handleBigIntData(data: any): any {
  // 如果是数组，递归处理每个元素
  if (Array.isArray(data)) {
    return data.map(item => handleBigIntData(item));
  }

  // 如果是对象，递归处理每个属性
  if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    const result: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        result[key] = handleBigIntData(data[key]);
      }
    }
    return result;
  }

  // 如果是BigInt类型，转换为字符串
  if (typeof data === 'bigint') {
    return data.toString();
  }

  // 其他情况直接返回
  return data;
}

/**
 * 安全地将响应数据转换为JSON字符串
 * @param data 要转换的数据
 * @returns JSON字符串
 */
export function safeStringify(data: any): string {
  const processedData = handleBigIntData(data);
  return JSON.stringify(processedData, (key, value) => {
    // 处理特殊情况
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
}