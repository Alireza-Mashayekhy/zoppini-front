import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { CreateOrderDto, OrderResponse } from './type';

export const createOrder = async (dto: CreateOrderDto) => {
  const { data } = await api.post(endpoints.order.create, dto);
  return data;
};

export const getOrders = async (): Promise<ApiListResponse<OrderResponse>> => {
  const { data } = await api.get(endpoints.order.list);
  return data;
};

export const getOrder = async (
  id: number,
): Promise<ApiSingleResponse<OrderResponse>> => {
  const url = endpoints.order.get(id);
  const { data } = await api.get(url);
  return data;
};

export const cancelOrder = async (id: number): Promise<void> => {
  const url = endpoints.order.cancel(id);
  await api.patch(url);
};
