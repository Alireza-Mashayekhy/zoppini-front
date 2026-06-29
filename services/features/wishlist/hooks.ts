import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  addToWishlist,
  checkWishlist,
  getWishlist,
  getWishlistCount,
  getWishlistProducts,
  removeFromWishlist,
} from './api';

export const useWishlist = () => {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
  });
};

export const useWishlistProducts = () => {
  return useQuery({
    queryKey: ['wishlist-products'],
    queryFn: getWishlistProducts,
  });
};

export const useCheckWishlist = (productId: number) => {
  return useQuery({
    queryKey: ['wishlist-check', productId],
    queryFn: () => checkWishlist(productId),
    enabled: !!productId,
  });
};

export const useWishlistCount = () => {
  return useQuery({
    queryKey: ['wishlist-count'],
    queryFn: getWishlistCount,
  });
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => addToWishlist(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-products'] });
      queryClient.invalidateQueries({
        queryKey: ['wishlist-check', productId],
      });
      queryClient.invalidateQueries({ queryKey: ['wishlist-count'] });
      toast.success('به لیست علاقه‌مندی‌ها اضافه شد');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'خطا در افزودن به علاقه‌مندی‌ها');
    },
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => removeFromWishlist(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-products'] });
      queryClient.invalidateQueries({
        queryKey: ['wishlist-check', productId],
      });
      queryClient.invalidateQueries({ queryKey: ['wishlist-count'] });
      toast.success('از لیست علاقه‌مندی‌ها حذف شد');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'خطا در حذف از علاقه‌مندی‌ها');
    },
  });
};
