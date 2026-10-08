import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { CreatePageSeoDto, PageSeoResponse, UpdatePageSeoDto } from './types';

export async function adminPageSeoList(query: {
  page?: number;
  limit?: number;
  search?: string;
  all?: boolean;
}) {
  const { data } = await api.get<ApiListResponse<PageSeoResponse>>(
    endpoints.seo.adminList,
    { params: query },
  );

  return data;
}

export async function createPageSeo(dto: CreatePageSeoDto) {
  const { data } = await api.post<ApiSingleResponse<PageSeoResponse>>(
    endpoints.seo.create,
    dto,
  );

  return data;
}

export async function updatePageSeo(id: number, dto: UpdatePageSeoDto) {
  const { data } = await api.patch<ApiSingleResponse<PageSeoResponse>>(
    endpoints.seo.update(id),
    dto,
  );

  return data;
}

export async function deletePageSeo(id: number) {
  const { data } = await api.delete<ApiSingleResponse<PageSeoResponse>>(
    endpoints.seo.delete(id),
  );

  return data;
}

/** همه‌ی صفحات سئو (برای مصرف سمت سرور یا پنل) */
export async function pageSeoList() {
  const { data } = await api.get<ApiListResponse<PageSeoResponse>>(
    endpoints.seo.pages,
  );

  return data;
}
