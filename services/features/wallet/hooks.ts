// services/features/wallet/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { PaymentGateway } from '../payment/type';
import { getWallet, getWalletTransactions, startWalletCharge } from './api';
import { WalletTransactionsQuery } from './type';

/**
 * اطلاعات کیف پول
 */
export const useWallet = () => {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: getWallet,
  });
};

/**
 * تاریخچه تراکنش‌های کیف پول
 */
export const useWalletTransactions = (query: WalletTransactionsQuery) => {
  return useQuery({
    queryKey: ['wallet', 'transactions', query],
    queryFn: () => getWalletTransactions(query),
    placeholderData: previousData => previousData,
  });
};

/**
 * شروع شارژ کیف پول از درگاه بانکی
 */
export const useStartWalletCharge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      amount,
      gateway,
    }: {
      amount: number;
      gateway: PaymentGateway;
    }) => startWalletCharge(amount, gateway),
    onSuccess: () => {
      /**
       * پس از واریز موفق در درگاه، مبلغ به‌صورت خودکار
       * به کیف پول اضافه می‌شود؛ اطلاعات را تازه می‌کنیم
       */
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'خطا در شروع شارژ کیف پول');
    },
  });
};
