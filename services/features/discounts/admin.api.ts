import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { CreateDiscountDto, Discount, UpdateDiscountDto } from './types';

export interface GetAdminDiscountsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getAdminDiscounts(
  params?: GetAdminDiscountsParams,
): Promise<ApiListResponse<Discount>> {
  const response = await api.get(endpoints.discounts.list, {
    params,
  });

  return response.data;
}

export async function getAdminDiscount(
  id: number,
): Promise<ApiSingleResponse<Discount>> {
  const response = await api.get(endpoints.discounts.detail(id));

  return response.data;
}

export async function createDiscount(
  dto: CreateDiscountDto,
): Promise<ApiSingleResponse<Discount>> {
  const response = await api.post(endpoints.discounts.create, dto);

  return response.data;
}

export async function updateDiscount(
  id: number,
  dto: UpdateDiscountDto,
): Promise<ApiSingleResponse<Discount>> {
  const response = await api.patch(endpoints.discounts.update(id), dto);

  return response.data;
}

export async function deleteDiscount(id: number) {
  const response = await api.delete(endpoints.discounts.delete(id));

  return response.data;
}
