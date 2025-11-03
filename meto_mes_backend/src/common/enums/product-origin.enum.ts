export enum ProductOrigin {
  SUZHOU = 1,
  MIANYANG = 2,
}

export const PRODUCT_ORIGIN_LABEL_MAP: Record<ProductOrigin, string> = {
  [ProductOrigin.SUZHOU]: '苏州',
  [ProductOrigin.MIANYANG]: '绵阳',
};

export const PRODUCT_ORIGIN_OPTIONS: Array<{ label: string; value: ProductOrigin }> = [
  {
    label: PRODUCT_ORIGIN_LABEL_MAP[ProductOrigin.SUZHOU],
    value: ProductOrigin.SUZHOU,
  },
  {
    label: PRODUCT_ORIGIN_LABEL_MAP[ProductOrigin.MIANYANG],
    value: ProductOrigin.MIANYANG,
  },
];

export const getProductOriginLabel = (origin?: ProductOrigin | null): string => {
  if (!origin) {
    return '';
  }
  return PRODUCT_ORIGIN_LABEL_MAP[origin] ?? '';
};
