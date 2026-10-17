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
  return useQuery({
    queryKey: ['club', 'wallets', customerWalletId, 'transactions'],
    queryFn: () => getClubWalletTransactions(customerWalletId as number),
    enabled: enabled && customerWalletId != null,
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
