import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse } from '@/services/api/types';

import { CategoriesResponse } from './types';

export async function categoriesList(query: { page: number; search: string }) {
  const { data } = await api.get<ApiListResponse<CategoriesResponse>>(
    endpoints.categories.list,
    {
      params: query,
    },
  );

  return data;
}
