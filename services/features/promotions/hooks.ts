import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  acceptPromotion,
  addPromotionReward,
  AdminPromotionsQuery,
  createPromotion,
  deletePromotion,
  dismissPromotion,
  getAdminPromotion,
  getAdminPromotions,
  getCartPromotionSuggestions,
  getProductPromotionBadges,
  getPromotionRedemptions,
  previewPromotion,
  removePromotionReward,
  selectPromotionReward,
  setPromotionStatus,
  updatePromotion,
} from './api';
import { CreatePromotionDto, UpdatePromotionDto } from './types';

// =========================================================
// مشتری
// =========================================================

export function useProductPromotionBadges(slug: string, enabled = true) {
  return useQuery({
    queryKey: ['promotion-badges', slug],
    queryFn: () => getProductPromotionBadges(slug),
    enabled: !!slug && enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useCartPromotionSuggestions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['promotion-suggestions'],
    queryFn: () => getCartPromotionSuggestions(),
    enabled: options?.enabled ?? true,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    retry: 0,
  });
}

function useCartMutation<TArg>(
  mutationFn: (arg: TArg) => Promise<unknown>,
  options?: { errorMessage?: string; successMessage?: string },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['checkout-preview'] });

      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          options?.errorMessage ??
          'خطا در اعمال پیشنهاد',
      );
    },
  });
}

export function useAddPromotionReward() {
  return useCartMutation(
    (payload: {
      promotionId: number;
      variantId?: number;
      productId?: number;
      quantity?: number;
    }) => addPromotionReward(payload),
    { successMessage: 'هدیه به سبد خرید اضافه شد و رایگان محاسبه می‌شود.' },
  );
}

export function useSelectPromotionReward() {
  return useCartMutation(
    (payload: { promotionId: number; variantId: number; quantity?: number }) =>
      selectPromotionReward(payload),
    { successMessage: 'هدیهٔ انتخابی به سبد اضافه شد.' },
  );
}

export function useAcceptPromotion() {
  return useCartMutation(
    (payload: { promotionId: number; accepted?: boolean }) =>
      acceptPromotion(payload.promotionId, payload.accepted ?? true),
  );
}

export function useDismissPromotion() {
  return useCartMutation((promotionId: number) =>
    dismissPromotion(promotionId),
  );
}

export function useRemovePromotionReward() {
  return useCartMutation(
    (promotionId: number) => removePromotionReward(promotionId),
    { successMessage: 'هدیه از سبد حذف شد.' },
  );
}

// =========================================================
// ادمین
// =========================================================

export function useAdminPromotions(params: AdminPromotionsQuery) {
  return useQuery({
    queryKey: ['admin-promotions', params],
    queryFn: () => getAdminPromotions(params),
    placeholderData: previous => previous,
  });
}

export function useAdminPromotion(id?: number) {
  return useQuery({
    queryKey: ['admin-promotion', id],
    queryFn: () => getAdminPromotion(id!),
    enabled: !!id,
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePromotionDto) => createPromotion(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdatePromotionDto }) =>
      updatePromotion(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      queryClient.invalidateQueries({
        queryKey: ['admin-promotion', variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
    },
  });
}

export function useSetPromotionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setPromotionStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

/**
 * گزارش استفاده از یک پروموشن.
 * مبالغ از روی رکورد redemption خوانده می‌شود، نه تنظیمات فعلی پروموشن،
 * بنابراین با ویرایش پروموشن تاریخچه تغییر نمی‌کند.
 */
export function usePromotionRedemptions(id: number | null) {
  return useQuery({
    queryKey: ['promotion-redemptions', id],
    queryFn: () => getPromotionRedemptions(id as number),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function usePreviewPromotion() {
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: number;
      productIds?: number[];
      quantity?: number;
      cartValue?: number;
      now?: string;
      allowStacking?: boolean;
    }) => previewPromotion(id, payload),
  });
}
