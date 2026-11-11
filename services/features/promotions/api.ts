import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import {
  CartPromotionsState,
  CreatePromotionDto,
  PreviewPromotionResponse,
  Promotion,
  PromotionBadge,
  PromotionRedemptionRow,
  PromotionSuggestionView,
  PromotionType,
  UpdatePromotionDto,
} from './types';

// =========================================================
// عمومی
// =========================================================

export async function getProductPromotionBadges(slug: string) {
  const { data } = await api.get<ApiListResponse<PromotionBadge>>(
    endpoints.promotions.productBadges(slug),
  );

  return data;
}

export async function getCartPromotionSuggestions() {
  const { data } = await api.get<
    ApiSingleResponse<{
      suggestions: PromotionSuggestionView[];
      applied: CartPromotionsState['applied'];
      rejected: CartPromotionsState['rejected'];
      notices: string[];
      popupShownFor: string | null;
      acceptedPromotions: number[];
    }>
  >(endpoints.promotions.suggestions);

  return data;
}

export async function markPopupShown(stateKey: string) {
  const { data } = await api.post(endpoints.promotions.popupShown, {
    stateKey,
  });

  return data;
}

export async function acceptPromotion(promotionId: number, accepted = true) {
  const { data } = await api.post(endpoints.promotions.accept(promotionId), {
    accepted,
  });

  return data;
}

export async function dismissPromotion(promotionId: number) {
  const { data } = await api.post(endpoints.promotions.dismiss(promotionId));

  return data;
}

export async function addPromotionReward(payload: {
  promotionId: number;
  variantId?: number;
  productId?: number;
  quantity?: number;
}) {
  const { data } = await api.post(endpoints.promotions.addReward, payload);

  return data;
}

export async function selectPromotionReward(payload: {
  promotionId: number;
  variantId: number;
  quantity?: number;
}) {
  const { data } = await api.post(endpoints.promotions.selectReward, payload);

  return data;
}

export async function removePromotionReward(promotionId: number) {
  const { data } = await api.post(endpoints.promotions.removeReward, {
    promotionId,
  });

  return data;
}

export async function simulatePromotion(payload: {
  promotionId: number;
  items?: { variantId: number; quantity: number }[];
  productIds?: number[];
  quantity?: number;
  now?: string;
}) {
  const { data } = await api.post(endpoints.promotions.simulate, payload);

  return data;
}

// =========================================================
// ادمین
// =========================================================

export interface AdminPromotionsQuery {
  search?: string;
  type?: PromotionType;
  status?: string;
}

export async function getAdminPromotions(params?: AdminPromotionsQuery) {
  const { data } = await api.get<ApiListResponse<Promotion>>(
    endpoints.promotions.adminList,
    { params },
  );

  return data;
}

export async function getAdminPromotion(id: number) {
  const { data } = await api.get<ApiSingleResponse<Promotion>>(
    endpoints.promotions.adminDetail(id),
  );

  return data;
}

export async function createPromotion(dto: CreatePromotionDto) {
  const { data } = await api.post<ApiSingleResponse<Promotion>>(
    endpoints.promotions.adminCreate,
    dto,
  );

  return data;
}

export async function updatePromotion(id: number, dto: UpdatePromotionDto) {
  const { data } = await api.patch<ApiSingleResponse<Promotion>>(
    endpoints.promotions.adminUpdate(id),
    dto,
  );

  return data;
}

export async function setPromotionStatus(id: number, isActive: boolean) {
  const { data } = await api.patch<ApiSingleResponse<Promotion>>(
    endpoints.promotions.adminStatus(id),
    { isActive },
  );

  return data;
}

export async function deletePromotion(id: number) {
  const { data } = await api.delete(endpoints.promotions.adminDelete(id));

  return data;
}

export async function previewPromotion(
  id: number,
  payload: {
    productIds?: number[];
    quantity?: number;
    cartValue?: number;
    now?: string;
    allowStacking?: boolean;
  },
) {
  const { data } = await api.post<ApiSingleResponse<PreviewPromotionResponse>>(
    endpoints.promotions.adminPreview(id),
    payload,
  );

  return data;
}

export async function getPromotionRedemptions(id: number) {
  const { data } = await api.get<ApiListResponse<PromotionRedemptionRow>>(
    endpoints.promotions.adminRedemptions(id),
  );

  return data;
}
