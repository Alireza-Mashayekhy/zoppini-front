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

export async function startPayment(orderId: number, gateway: PaymentGateway) {
  await track('checkout_started');
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
