// services/features/club/hooks.ts
import { useQuery } from '@tanstack/react-query';

import {
  getClubLevels,
  getClubLoyaltyHistories,
  getClubMe,
  getClubWallets,
  getClubWalletTransactions,
} from './api';

/**
 * اطلاعات کاربر در باشگاه مشتریان دایاتک
 */
export const useClubMe = () => {
  return useQuery({
    queryKey: ['club', 'me'],
    queryFn: getClubMe,
    retry: 1,
  });
};

/**
 * کیف پول‌های کاربر در باشگاه دایاتک
 */
export const useClubWallets = () => {
  return useQuery({
    queryKey: ['club', 'wallets'],
    queryFn: getClubWallets,
  });
};

/**
 * تراکنش‌های یک کیف پول باشگاه
 */
export const useClubWalletTransactions = (
  customerWalletId: number | null,
  enabled = true,
) => {
  // شناسه‌ی نامعتبر (0/null) نباید درخواست شبکه‌ای بسازد؛ وگرنه تقاضای
  // `/club/wallets/0/transactions` همیشه 403 برمی‌گرداند و بخش تراکنش‌ها
  // به‌جای «لیست خالی» پیام خطا نشان می‌دهد.
  const hasValidId =
    typeof customerWalletId === 'number' &&
    Number.isFinite(customerWalletId) &&
    customerWalletId > 0;

  return useQuery({
    queryKey: ['club', 'wallets', customerWalletId, 'transactions'],
    queryFn: () => getClubWalletTransactions(customerWalletId as number),
    enabled: enabled && hasValidId,
  });
};

/**
 * تاریخچه وفاداری کاربر
 */
export const useClubLoyaltyHistories = () => {
  return useQuery({
    queryKey: ['club', 'loyalty-histories'],
    queryFn: getClubLoyaltyHistories,
  });
};

/**
 * سطوح وفاداری باشگاه
 */
export const useClubLevels = () => {
  return useQuery({
    queryKey: ['club', 'levels'],
    queryFn: getClubLevels,
  });
};
