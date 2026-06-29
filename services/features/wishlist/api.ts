// services/features/wishlist/api.ts

import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { ProductsResponse } from '../products/type';
import {
  WishlistCheckResponse,
  WishlistCountResponse,
  WishlistItem,
} from './types';

export const getWishlist = async (): Promise<ApiListResponse<WishlistItem>> => {
  const { data } = await api.get(endpoints.wishlist.get);
  return data;
};

export const getWishlistProducts = async (): Promise<ProductsResponse[]> => {
  const { data } = await api.get(endpoints.wishlist.products);
  return data;
};

export const checkWishlist = async (productId: number): Promise<boolean> => {
  const url = endpoints.wishlist.check(productId);

  const { data } = await api.get<ApiSingleResponse<WishlistCheckResponse>>(url);
  console.log('data', data);
  return data.data.isInWishlist;
};

export const getWishlistCount = async (): Promise<number> => {
  const { data } = await api.get<ApiSingleResponse<WishlistCountResponse>>(
    endpoints.wishlist.count,
  );
  return data.data.count;
};

export const addToWishlist = async (productId: number): Promise<void> => {
  await api.post(endpoints.wishlist.add, { productId });
};

export const removeFromWishlist = async (productId: number): Promise<void> => {
  const url = endpoints.wishlist.remove(productId);
  await api.delete(url);
};
