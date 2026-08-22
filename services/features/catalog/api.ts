import { api } from '@/services/api/client';
import { ApiListResponse } from '@/services/api/types';

import { CatalogPageResponse } from './types';

export async function getCatalogPages() {
  const { data } = await api.get<ApiListResponse<CatalogPageResponse>>(
    '/admin/catalog/pages',
  );

  return data;
}

export async function createCatalogPage(formData: FormData) {
  const { data } = await api.post('/admin/catalog/pages', formData);

  return data;
}

export async function updateCatalogPage(id: string, formData: FormData) {
  const { data } = await api.patch(`/admin/catalog/pages/${id}`, formData);

  return data;
}

export async function deleteCatalogPage(id: string) {
  const { data } = await api.delete(`/admin/catalog/pages/${id}`);

  return data;
}
