import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { AddressResponse } from '../addresses/types';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface OrderUser {
  id: number;
  fullName?: string;
  phone?: string;
  email?: string;
}

export interface OrderProduct {
  id: number;
  title: string;
  productCode?: string;
  image?: string | null;
}

export interface OrderVariant {
  id: number;
  sizeId?: number;
  colorId?: number;
  sku?: string | null;
  product?: OrderProduct;
}

export interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  variant?: OrderVariant;
}

export interface AdminOrder {
  id: number;
  orderNumber?: string;

  status: OrderStatus;

  totalPrice: number | string;
  discount: number | string;
  shippingCost: number | string;
  finalPrice: number | string;

  shippingMethod?: string | null;
  note?: string | null;
  phone?: string | null;
  addressId?: number | null;

  address: AddressResponse;

  createdAt: string;
  updatedAt?: string;

  user?: OrderUser;

  items?: OrderItem[];

  payment?: {
    id: number;
    status?: string;
    gateway?: string;
    amount?: number | string;
    trackingCode?: string | null;
  };
}

export interface AdminOrdersStats {
  total: number;
  pending: number;
  processing: number;
  delivered: number;
  cancelled: number;
  failed: number;
}

export interface AdminOrdersQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getAdminOrders(
  params?: AdminOrdersQuery,
): Promise<ApiListResponse<AdminOrder>> {
  const response = await api.get<ApiListResponse<AdminOrder>>(
    endpoints.order.adminList,
    {
      params,
    },
  );

  return response.data;
}

export async function getAdminOrder(
  id: number,
): Promise<ApiSingleResponse<AdminOrder>> {
  const response = await api.get<ApiSingleResponse<AdminOrder>>(
    endpoints.order.adminGet(id),
  );

  return response.data;
}

export async function updateAdminOrderStatus(
  id: number,
  status: OrderStatus,
): Promise<ApiSingleResponse<AdminOrder>> {
  const response = await api.patch<ApiSingleResponse<AdminOrder>>(
    endpoints.order.adminUpdateStatus(id),
    {
      status,
    },
  );

  return response.data;
}

export async function cancelAdminOrder(
  id: number,
  reason?: string,
): Promise<ApiSingleResponse<AdminOrder>> {
  const response = await api.patch<ApiSingleResponse<AdminOrder>>(
    endpoints.order.adminCancel(id),
    {
      reason,
    },
  );

  return response.data;
}
