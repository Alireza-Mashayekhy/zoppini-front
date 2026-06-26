import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiSingleResponse } from '@/services/api/types';

import { AddToCartDto, CartResponse, UpdateCartItemDto } from './types';

export async function cartList() {
  const { data } = await api.get<ApiSingleResponse<CartResponse>>(
    endpoints.cart.list,
  );

  return data;
}

export async function addToCart(formData: AddToCartDto) {
  const { data } = await api.post<ApiSingleResponse<CartResponse>>(
    endpoints.cart.add,
    formData,
  );

  return data;
}

export async function updateCartItem(id: number, formData: UpdateCartItemDto) {
  const url = endpoints.cart.update(id);
  const { data } = await api.patch<ApiSingleResponse<CartResponse>>(
    url,
    formData,
  );
  return data;
}

export async function deleteItem(id: number) {
  const url = endpoints.cart.deleteItem(id);
  const { data } = await api.delete<ApiSingleResponse<CartResponse>>(url);
  return data;
}

export async function clearCart() {
  const url = endpoints.cart.clear;
  const { data } = await api.delete<ApiSingleResponse<CartResponse>>(url);
  return data;
}
