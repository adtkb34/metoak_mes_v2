export enum ProductOrigin {
  Suzhou = 1,
  Mianyang = 2
}

export const PRODUCT_ORIGIN_LABEL_MAP: Record<ProductOrigin, string> = {
  [ProductOrigin.Suzhou]: "苏州",
  [ProductOrigin.Mianyang]: "绵阳"
};

export const PRODUCT_ORIGIN_OPTIONS: Array<{
  label: string;
  value: ProductOrigin;
}> = [
  { label: PRODUCT_ORIGIN_LABEL_MAP[ProductOrigin.Suzhou], value: ProductOrigin.Suzhou },
  { label: PRODUCT_ORIGIN_LABEL_MAP[ProductOrigin.Mianyang], value: ProductOrigin.Mianyang }
];

export function getProductOriginLabel(origin?: ProductOrigin | null): string {
  if (!origin) return "";
  return PRODUCT_ORIGIN_LABEL_MAP[origin] ?? "";
}
