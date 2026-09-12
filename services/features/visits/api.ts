import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { VisitResponse, VisitStats } from './type';

export interface VisitListQuery {
  page?: number;
  limit?: number;
  search?: string;
  pageFilter?: string;
  deviceType?: string;
  from?: string;
  to?: string;
}

export async function visitsList(query: VisitListQuery) {
  const { data } = await api.get<ApiListResponse<VisitResponse>>(
    endpoints.visits.list,
    {
      params: query,
    },
  );

  return data;
}

export async function visitStats() {
  const { data } = await api.get<ApiSingleResponse<VisitStats>>(
    endpoints.visits.stats,
  );

  return data;
}

export async function deleteVisit(id: number) {
  const { data } = await api.delete<ApiSingleResponse<unknown>>(
    endpoints.visits.delete(id),
  );

  return data;
}
