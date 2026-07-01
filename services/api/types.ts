export interface ApiListResponse<T> {
  status: number;
  message: string;
  data: T[];
  pagination: PaginationMeta;
  stats: any;
}

export interface ApiSingleResponse<T> {
  status: number;
  message: string;
  data: T;
  stats: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
