import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  addToCart,
  cartList,
  clearCart,
  deleteItem,
  updateCartItem,
} from './api';
import { AddToCartDto, UpdateCartItemDto } from './types';

/**
 * پس از هر تغییر سبد، این کلیدها باید تازه شوند:
 * - `cart`: خود سبد
 * - `promotion-suggestions`: پاپ‌آپ پیشنهاد (شرط‌ها با تعداد کالا عوض می‌شود)
 * - `checkout-preview`: مبالغ معتبر چک‌اوت
 *
 * اگر یکی جا بیفتد، مشتری می‌تواند کالای رایگان یا تخفیفی را ببیند که دیگر
 * معتبر نیست.
 */
function invalidateCartDependents(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['cart'] });
  queryClient.invalidateQueries({ queryKey: ['promotion-suggestions'] });
  queryClient.invalidateQueries({ queryKey: ['checkout-preview'] });
}

export const useCartList = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => cartList(),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddToCartDto) => addToCart(data),
    onSuccess: () => {
      invalidateCartDependents(queryClient);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCartItemDto }) =>
      updateCartItem(id, data),
    onSuccess: () => {
      invalidateCartDependents(queryClient);
    },
  });
}

export function useDeleteCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteItem(id),
    onSuccess: (response: any) => {
      invalidateCartDependents(queryClient);

      // پیام شفاف وقتی حذف یک کالا باعث از بین رفتن هدیه/تخفیف می‌شود
      if (response?.message) {
        /*
         * سرور پیام فارسی آماده می‌فرستد؛ در صورت وجود، به‌جای سکوت نشان
         * داده می‌شود تا مشتری دلیل تغییر قیمت را بداند.
         */
        import('sonner').then(({ toast }) => {
          toast.info(response.message);
        });
      }
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearCart(),
    onSuccess: () => {
      invalidateCartDependents(queryClient);
    },
  });
}
