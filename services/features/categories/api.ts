import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { CategoriesResponse } from './types';

export async function categoriesList(query: {
  page?: number;
  search?: string;
  all?: boolean;
}) {
  const { data } = await api.get<ApiListResponse<CategoriesResponse>>(
    endpoints.categories.list,
    {
      params: query,
    },
  );

  return data;
}

export async function createCategory(formData: FormData) {
  const { data } = await api.post<ApiSingleResponse<CategoriesResponse>>(
    endpoints.categories.create,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );

  return data;
}

export async function updateCategory(id: number, formData: FormData) {
  const url = endpoints.categories.update(id);
  const { data } = await api.patch<ApiSingleResponse<CategoriesResponse>>(
    url,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function deleteCategory(id: number) {
  const url = endpoints.categories.delete(id);
  const { data } = await api.delete<ApiSingleResponse<CategoriesResponse>>(url);
  return data;
}
