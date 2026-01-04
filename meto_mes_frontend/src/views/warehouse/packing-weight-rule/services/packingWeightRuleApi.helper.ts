export type ApiResponse<T> = {
  code?: number;
  data?: T;
  message?: string;
};

const SUCCESS_CODES = [0, 200] as const;

const isApiResponse = <T>(value: ApiResponse<T> | T): value is ApiResponse<T> =>
  typeof value === "object" && value !== null && "code" in value;

export const unwrapResponse = <T>(
  response: ApiResponse<T> | T,
  errorMessage: string
): T => {
  if (isApiResponse<T>(response)) {
    if (
      response.code !== undefined &&
      !SUCCESS_CODES.includes(response.code as (typeof SUCCESS_CODES)[number])
    ) {
      throw new Error(response.message ?? errorMessage);
    }
    if (response.data !== undefined) {
      return response.data as T;
    }
  }
  return response as T;
};

export const getBackendBaseUrl = (): string =>
  import.meta.env.VITE_JAVA_BACKEND_URL ?? "";
