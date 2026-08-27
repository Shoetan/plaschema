export type OffsetPaginationMeta = {
  total: number;
  page: number;
  pageSize: number;
};

export type CursorPaginationMeta = {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
};

export type PaginationMeta = OffsetPaginationMeta | CursorPaginationMeta;

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  meta: PaginationMeta | null;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  details: unknown;
};

export type ApiErrorResponse = {
  success: false;
  error: ApiErrorBody;
};

export function successResponse<T>(
  data: T,
  meta: PaginationMeta | null = null,
): ApiSuccessResponse<T> {
  return { success: true, data, meta };
}
