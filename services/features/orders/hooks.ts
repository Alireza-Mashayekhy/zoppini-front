// services/features/orders/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  cancelOrder,
  confirmOrderFromWallet,
  getOrder,
  getOrders,
  previewCheckout,
} from './api';
import { createOrder } from './api';
import { CreateOrderDto } from './type';

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });
};

export const useOrder = (id: number) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('سفارش با موفقیت لغو شد');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'خطا در لغو سفارش');
    },
  });
};

export const useConfirmOrderFromWallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => confirmOrderFromWallet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('سفارش با کیف پول تأیید شد');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'خطا در تأیید سفارش با کیف پول',
      );
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderDto) => createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'خطا در ثبت سفارش');
    },
  });
};

/**
 * پیش‌نمایش زندهٔ چک‌اوت (کالای رایگان، تخفیف پروموشن، ارسال رایگان).
 *
 * چرا از سرور می‌خوانیم و از سبد محلی نه: بازهٔ زمانی پروموشن و موجودی می‌تواند
 * همان لحظه تغییر کند؛ عددی که در چک‌اوت نمایش می‌دهیم باید با عدد لحظهٔ
 * ثبت سفارش یکی باشد.
 */
export const useCheckoutPreview = (shippingMethod?: string) => {
  return useQuery({
    queryKey: ['checkout-preview', shippingMethod ?? 'default'],
    queryFn: () => previewCheckout(shippingMethod),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: false,
  });
};
