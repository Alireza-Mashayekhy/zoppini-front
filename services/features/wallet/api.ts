// services/features/wallet/api.ts
import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { type StartPaymentResponse } from '../payment/api';
import { PaymentGateway } from '../payment/type';
import { WalletInfo, WalletTransaction, WalletTransactionsQuery } from './type';

/**
 * اطلاعات کیف پول کاربر لاگین‌شده
 */
export const getWallet = async (): Promise<ApiSingleResponse<WalletInfo>> => {
  const { data } = await api.get<ApiSingleResponse<WalletInfo>>(
    endpoints.wallet.info,
  );
  return data;
};

/**
 * تاریخچه تراکنش‌های کیف پول (با صفحه‌بندی و فیلتر نوع)
 */
export const getWalletTransactions = async (
  query: WalletTransactionsQuery,
): Promise<ApiListResponse<WalletTransaction>> => {
  const { data } = await api.get<ApiListResponse<WalletTransaction>>(
    endpoints.wallet.transactions,
    { params: query },
  );
  return data;
};

/**
 * شروع شارژ کیف پول از درگاه بانکی
 * (شکل پاسخ دقیقاً مانند POST /payment/start)
 */
export const startWalletCharge = async (
  amount: number,
  gateway: PaymentGateway,
): Promise<ApiSingleResponse<StartPaymentResponse>> => {
  const { data } = await api.post<ApiSingleResponse<StartPaymentResponse>>(
    endpoints.payment.startWalletCharge,
    {
      amount,
      gateway,
    },
  );
  return data;
};
