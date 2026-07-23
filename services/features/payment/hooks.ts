import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { startPayment } from './api';
import { PaymentGateway } from './type';

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
