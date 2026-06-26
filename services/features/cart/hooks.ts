import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addToCart,
  cartList,
  clearCart,
  deleteItem,
  updateCartItem,
} from './api';
import { AddToCartDto, UpdateCartItemDto } from './types';

export const useCartList = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => cartList(),
  });
};

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddToCartDto) => addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCartItemDto }) =>
      updateCartItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useDeleteCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
