// services/features/b2b/api.ts
import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { B2bResponse, CreateB2bDto } from './types';

export async function requestList(query: {
  page?: number;
  search?: string;
  all?: boolean;
}) {
  const { data } = await api.get<ApiListResponse<B2bResponse>>(
    endpoints.b2b.list,
    { params: query },
  );
  return data;
}

export async function createRequest(formData: CreateB2bDto) {
  const { data } = await api.post<ApiSingleResponse<B2bResponse>>(
    endpoints.b2b.create,
    formData,
  );
  return data;
}
