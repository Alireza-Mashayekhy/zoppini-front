import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import {
  GamificationDto,
  GamificationResponse,
  GamificationStats,
} from './type';

export async function gamificationList(query: {
  page?: number;
  search?: string;
}) {
  const { data } = await api.get<ApiListResponse<GamificationResponse>>(
    endpoints.gamificateion.list,
    {
      params: query,
    },
  );

  return data;
}

export async function gamificationStats() {
  const { data } = await api.get<ApiSingleResponse<GamificationStats>>(
    endpoints.gamificateion.stats,
  );

  return data;
}

export async function createGamification(formData: GamificationDto) {
  const { data } = await api.post<ApiSingleResponse<GamificationResponse>>(
    endpoints.gamificateion.create,
    formData,
  );

  return data;
}
