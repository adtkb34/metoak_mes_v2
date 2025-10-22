export enum ERROR_CODE {
    SUCCESS = 0,
    // server error
    DEFAULT,
    // database error
    EMPTY_DATA = -1,
    TRACE_ERROR = -2,
    INSERT_ERROR,
    FIELD_ERROR,
}

export function mo_success(data: any | null = null, message = "success") {
  return { error_code: ERROR_CODE.SUCCESS, data, message };
}

export function mo_fail(message = "fail", error_code: ERROR_CODE | number = ERROR_CODE.DEFAULT) {
  return { error_code, data: [], message };
}
