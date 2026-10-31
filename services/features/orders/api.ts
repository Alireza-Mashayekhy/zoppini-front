import { analyticsContext, track } from '@/lib/consent/client';
import { torobAttributionContext } from '@/lib/consent/torob-client';
import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { CreateOrderDto, OrderResponse } from './type';

export const createOrder = async (dto: CreateOrderDto) => {
  void track('checkout_started');
  const context = await analyticsContext();
  const attribution = await torobAttributionContext();
  const { data } = await api.post(endpoints.order.create, dto, {
    headers: { ...(attribution ? { 'X-Torob-Attribution': attribution } : {}), ...(context ? { 'X-Analytics-Context': context } : {}) },
  });
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

export const confirmOrderFromWallet = async (id: number): Promise<void> => {
  const url = endpoints.order.confirmFromWallet(id);
  void track('checkout_started');
  const context = await analyticsContext();
  await api.post(
    url,
    {},
    { headers: context ? { 'X-Analytics-Context': context } : {} },
  );
};
