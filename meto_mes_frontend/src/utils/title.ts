/**
 * 根据地区配置生成相应的MES标题
 * @returns {string} 根据地区配置生成的标题
 */
export function generateTitleByRegion(): string {
  // 从环境变量中获取地区配置
  const region = import.meta.env.VITE_REGION || "suzhou";

  // 定义各地区的标题映射
  const regionTitles: Record<string, string> = {
    suzhou: "MES系统(苏州)",
    mianyang: "MES系统(绵阳)",
    "ji'an": "MES系统(吉安)"
  };

  // 返回对应地区的标题，如果没有匹配则返回默认标题
  return regionTitles[region] || regionTitles.suzhou;
}

/**
 * 直接设置document.title
 */
export function setDocumentTitle(): void {
  document.title = generateTitleByRegion();
}

/**
 * 获取基础标题（不含地区前缀）
 * @returns {string} 基础标题
 */
export function getBaseTitle(): string {
  return "MES系统";
}

/**
 * 获取完整标题（地区前缀 + 基础标题）
 * @returns {string} 完整标题
 */
export function getFullTitle(): string {
  const regionTitle = generateTitleByRegion();
  const baseTitle = getBaseTitle();

  // 如果地区标题已经包含"MES系统"，则直接返回
  if (regionTitle.includes(baseTitle)) {
    return regionTitle;
  }

  // 否则组合地区前缀和基础标题
  return `${regionTitle}${baseTitle}`;
}