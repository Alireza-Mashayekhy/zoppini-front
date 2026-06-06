export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T | T[];
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
