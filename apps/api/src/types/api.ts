export interface ApiData {
  [key: string]: unknown;
}

/** Success envelope - all successful responses use this shape */
export interface ApiResponse<T = ApiData> {
  success: true;
  data?: T;
  message?: string;
}

/** Paginated list envelope */
export interface PaginatedMeta {
  page?: number;
  limit: number;
  total?: number; // omitted for cursor-based when not computed
  totalPages?: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginatedMeta;
  message?: string;
}

/** Error envelope - all error responses use this shape */
export interface ApiErrorResponse {
  success: false;
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}