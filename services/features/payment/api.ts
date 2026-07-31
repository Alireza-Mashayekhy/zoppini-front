import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiSingleResponse } from '@/services/api/types';

import { PaymentGateway } from './type';

export interface StartPaymentResponse {
  refId: string;
  payUrl: string;
}

export async function startPayment(orderId: number, gateway: PaymentGateway) {
  const { data } = await api.post<ApiSingleResponse<StartPaymentResponse>>(
    endpoints.payment.start,
    {
      orderId,
      gateway,
    },
  );
  return data;
}
