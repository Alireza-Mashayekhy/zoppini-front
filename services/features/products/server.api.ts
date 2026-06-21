import { serverFetch } from '@/services/api/server';
import { ApiListResponse } from '@/services/api/types';

import { ProductsResponse } from './type';

interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  categoryIds?: number[];
  colorIds?: number[];
  sizeIds?: number[];
}

export async function getProducts(params: GetProductsParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append('page', String(params.page));
  if (params.limit) searchParams.append('limit', String(params.limit));
  if (params.search) searchParams.append('search', params.search);
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.categoryIds?.length) {
    searchParams.append('categoryIds', params.categoryIds.join(','));
  }
  if (params.colorIds?.length) {
    searchParams.append('colorIds', params.colorIds.join(','));
  }
  if (params.sizeIds?.length) {
    searchParams.append('sizeIds', params.sizeIds.join(','));
  }

  console.log(searchParams);
  const url = `products?${searchParams.toString()}`;
  return serverFetch<ApiListResponse<ProductsResponse>>(url);
}
