// services/features/discount/api.ts

import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiSingleResponse } from '@/services/api/types';

import { ApplyDiscountDto, ApplyDiscountResponse } from './types';

export async function applyDiscount(dto: ApplyDiscountDto) {
  const { data } = await api.post<ApiSingleResponse<ApplyDiscountResponse>>(
    endpoints.discounts.apply,
    dto,
  );

  return data;
}
