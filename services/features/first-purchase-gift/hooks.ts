import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getFirstPurchaseGiftAdminSettings,
  getFirstPurchaseGiftConfig,
  getFirstPurchaseGiftEligibility,
  UpdateFirstPurchaseGift,
  updateFirstPurchaseGiftSettings,
} from './api';

export function useFirstPurchaseGiftConfig() {
  return useQuery({
    queryKey: ['first-purchase-gift', 'public'],
    queryFn: getFirstPurchaseGiftConfig,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 0,
  });
}

export function useFirstPurchaseGiftEligibility(enabled = true) {
  return useQuery({
    queryKey: ['first-purchase-gift', 'eligibility'],
    queryFn: getFirstPurchaseGiftEligibility,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 0,
  });
}

export function useAdminFirstPurchaseGift() {
  return useQuery({
    queryKey: ['admin-first-purchase-gift'],
    queryFn: getFirstPurchaseGiftAdminSettings,
  });
}

export function useUpdateFirstPurchaseGift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateFirstPurchaseGift) =>
      updateFirstPurchaseGiftSettings(payload),
    onSuccess: response => {
      queryClient.setQueryData(['admin-first-purchase-gift'], response);
      queryClient.invalidateQueries({ queryKey: ['first-purchase-gift'] });
    },
  });
}
