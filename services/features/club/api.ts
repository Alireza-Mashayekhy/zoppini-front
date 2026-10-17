// services/features/club/api.ts
import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiSingleResponse } from '@/services/api/types';

import {
  ClubCustomer,
  ClubWallet,
  ClubWalletTransaction,
  LoyaltyHistory,
  LoyaltyLevel,
} from './type';

/**
 * اطلاعات کاربر در باشگاه مشتریان دایاتک
 * (امتیاز، اعتبار، کیف پول‌ها، بن‌ها و ...)
 */
export const getClubMe = async (): Promise<
  ApiSingleResponse<ClubCustomer>
> => {
  const { data } = await api.get<ApiSingleResponse<ClubCustomer>>(
    endpoints.club.me,
  );
  return data;
};

/**
 * کیف پول‌های کاربر در باشگاه دایاتک
 */
export const getClubWallets = async (): Promise<
  ApiSingleResponse<ClubWallet[]>
> => {
  const { data } = await api.get<ApiSingleResponse<ClubWallet[]>>(
    endpoints.club.wallets,
  );
  return data;
};

/**
 * تراکنش‌های یک کیف پول باشگاه
 */
export const getClubWalletTransactions = async (
  customerWalletId: number,
): Promise<ApiSingleResponse<ClubWalletTransaction[]>> => {
  const { data } = await api.get<ApiSingleResponse<ClubWalletTransaction[]>>(
    endpoints.club.walletTransactions(customerWalletId),
  );
  return data;
};

/**
 * تاریخچه وفاداری کاربر (امتیاز / اعتبار / بن)
 */
export const getClubLoyaltyHistories = async (): Promise<
  ApiSingleResponse<LoyaltyHistory[]>
> => {
  const { data } = await api.get<ApiSingleResponse<LoyaltyHistory[]>>(
    endpoints.club.loyaltyHistories,
  );
  return data;
};

/**
 * سطوح وفاداری باشگاه
 */
export const getClubLevels = async (): Promise<
  ApiSingleResponse<LoyaltyLevel[]>
> => {
  const { data } = await api.get<ApiSingleResponse<LoyaltyLevel[]>>(
    endpoints.club.levels,
  );
  return data;
};
