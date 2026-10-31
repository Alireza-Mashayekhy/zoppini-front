import { analyticsContext, track } from '@/lib/consent/client';
import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiSingleResponse } from '@/services/api/types';

import { PaymentGateway } from './type';

export interface StartPaymentResponse {
  refId: string;
  payUrl: string;
  username?: string;
}

/** پاسخ بررسی امکان پرداخت اسنپ‌پی؛ عنوان و توضیح عیناً از اسنپ‌پی می‌آید و نباید تغییر کند */
export interface SnappayEligibility {
  eligible: boolean;
  title_message?: string;
  description?: string;
}

/**
 * بررسی داینامیک اسنپ‌پی. برای سفارش ساخته‌شده `orderId` بفرستید تا
 * مبلغ سمت سرور محاسبه شود؛ در چک‌اوت (قبل از ساخت سفارش) مبلغ به ریال
 * (`amount`) فقط برای نمایش است و شروع پرداخت مبلغ واقعی را دوباره
 * سمت سرور بررسی می‌کند.
 */
export async function getSnappayEligibility(params: {
  amount?: number;
  orderId?: number;
}) {
  const { data } = await api.get<ApiSingleResponse<SnappayEligibility>>(
    endpoints.payment.snappayEligibility,
    { params },
  );
  return data;
}

/** لغو کامل تراکنش اسنپ‌پی توسط ادمین (برگشت‌ناپذیر؛ تأیید صریح لازم است) */
export async function cancelSnappayPayment(paymentId: number) {
  const { data } = await api.post(
    endpoints.payment.snappayAdminCancel(paymentId),
    { confirm: true, cancelOrder: true },
  );
  return data;
}

export async function startPayment(orderId: number, gateway: PaymentGateway) {
  void track('checkout_started');
  const context = await analyticsContext();
  const { data } = await api.post<ApiSingleResponse<StartPaymentResponse>>(
    endpoints.payment.start,
    {
      orderId,
      gateway,
    },
    { headers: context ? { 'X-Analytics-Context': context } : {} },
  );
  return data;
}
