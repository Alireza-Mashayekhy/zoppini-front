// services/features/club/api.ts
import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiSingleResponse } from '@/services/api/types';

import { asArray, asCustomer } from './normalize';
import {
  ClubCustomer,
  ClubWallet,
  ClubWalletTransaction,
  LoyaltyHistory,
  LoyaltyLevel,
} from './type';

/**
 * پاسخ‌های باشگاه دایاتک در همه‌ی endpointها با یک شکل برنمی‌گردند
 * (آرایه‌ی خام، `{ Succeeded, Payload }`، `{ Items }`، `{ $values }` و ...).
 * نرمال‌سازی در همین لایه انجام می‌شود تا کامپوننت‌ها همیشه آرایه/آبجکت
 * معتبر دریافت کنند و رندر هیچ‌وقت روی شکل غیرمنتظره‌ی پاسخ نشکند.
 */
const emptyResponse = <T>(data: T): ApiSingleResponse<T> => ({
  status: 200,
  message: 'success',
  data,
  stats: undefined,
});

/**
 * اطلاعات کاربر در باشگاه مشتریان دایاتک
 * (امتیاز، اعتبار، کیف پول‌ها، بن‌ها و ...)
 */
export const getClubMe = async (): Promise<
  ApiSingleResponse<ClubCustomer | null>
> => {
  const { data } = await api.get<ApiSingleResponse<unknown>>(endpoints.club.me);

  return {
    ...emptyResponse(asCustomer(data?.data)),
    status: data?.status ?? 200,
    message: data?.message ?? 'success',
  };
};

/**
 * کیف پول‌های کاربر در باشگاه دایاتک
 */
export const getClubWallets = async (): Promise<
  ApiSingleResponse<ClubWallet[]>
> => {
  const { data } = await api.get<ApiSingleResponse<unknown>>(
    endpoints.club.wallets,
  );

  return {
    ...emptyResponse(asArray<ClubWallet>(data?.data)),
    status: data?.status ?? 200,
    message: data?.message ?? 'success',
  };
};

/**
 * تراکنش‌های یک کیف پول باشگاه
 */
export const getClubWalletTransactions = async (
  customerWalletId: number,
): Promise<ApiSingleResponse<ClubWalletTransaction[]>> => {
  const { data } = await api.get<ApiSingleResponse<unknown>>(
    endpoints.club.walletTransactions(customerWalletId),
  );

  return {
    ...emptyResponse(asArray<ClubWalletTransaction>(data?.data)),
    status: data?.status ?? 200,
    message: data?.message ?? 'success',
  };
};

/**
 * تاریخچه وفاداری کاربر (امتیاز / اعتبار / بن)
 */
export const getClubLoyaltyHistories = async (): Promise<
  ApiSingleResponse<LoyaltyHistory[]>
> => {
  const { data } = await api.get<ApiSingleResponse<unknown>>(
    endpoints.club.loyaltyHistories,
  );

  return {
    ...emptyResponse(asArray<LoyaltyHistory>(data?.data)),
    status: data?.status ?? 200,
    message: data?.message ?? 'success',
  };
};

/**
 * سطوح وفاداری باشگاه
 */
export const getClubLevels = async (): Promise<
  ApiSingleResponse<LoyaltyLevel[]>
> => {
  const { data } = await api.get<ApiSingleResponse<unknown>>(
    endpoints.club.levels,
  );

  return {
    ...emptyResponse(asArray<LoyaltyLevel>(data?.data)),
    status: data?.status ?? 200,
    message: data?.message ?? 'success',
  };
};
