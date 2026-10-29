import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  cancelSnappayPayment,
  getSnappayEligibility,
  startPayment,
} from './api';
import { PaymentGateway } from './type';

/**
 * امکان پرداخت اسنپ‌پی برای مبلغ فعلی.
 * طبق مستند اسنپ‌پی با هر تغییر مبلغ باید دوباره استعلام شود (مبلغ در
 * queryKey است و staleTime صفر) و فقط در صورت eligible بودن، با همان
 * عنوان/توضیح برگشتی نمایش داده شود. خطا یا غیرفعال بودن درگاه سمت
 * سرور eligible=false برمی‌گرداند، پس اینجا خطایی به کاربر نشان داده
 * نمی‌شود و چک‌اوت مثل قبل کار می‌کند.
 */
export function useSnappayEligibility(
  params: { amount?: number; orderId?: number },
  enabled = true,
) {
  const hasAmount =
    params.orderId !== undefined ||
    (params.amount !== undefined && params.amount > 0);

  return useQuery({
    queryKey: [
      'payment',
      'snappay-eligibility',
      params.orderId ?? null,
      params.amount ?? null,
    ],
    queryFn: () => getSnappayEligibility(params),
    enabled: enabled && hasAmount,
    staleTime: 0,
    retry: false,
    placeholderData: previousData => previousData,
  });
}

/** لغو تراکنش اسنپ‌پی توسط ادمین از جزئیات سفارش (برگشت‌ناپذیر) */
export function useCancelSnappayPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
    }: {
      paymentId: number;
      orderId: number;
    }) => cancelSnappayPayment(paymentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({
        queryKey: ['admin-order', variables.orderId],
      });
    },
  });
}

export function useStartPayment() {
  return useMutation({
    mutationFn: ({
      orderId,
      gateway,
    }: {
      orderId: number;
      gateway: PaymentGateway;
    }) => startPayment(orderId, gateway),
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در شروع پرداخت');
    },
  });
}
