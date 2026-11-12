import { api } from '@/services/api/client';

export type FirstPurchaseGiftFrequency = 'session' | 'daily' | 'always';

export interface FirstPurchaseGiftConfig {
  active: boolean;
  title: string;
  description: string;
  discountPercent: number;
  popupEnabled: boolean;
  announcementEnabled: boolean;
  popupFrequency: FirstPurchaseGiftFrequency;
}

export interface FirstPurchaseGiftEligibility {
  authenticated: boolean;
  eligible: boolean;
  reason:
    | 'eligible'
    | 'guest'
    | 'inactive'
    | 'already_purchased'
    | 'redeemed'
    | 'reserved';
  config: {
    discountPercent: number;
    title: string;
    description: string;
    stackWithDiscountCodes: boolean;
  } | null;
}

export interface FirstPurchaseGiftAdminSettings {
  isActive: boolean;
  discountPercent: number;
  title: string;
  description: string;
  startsAt: string | null;
  endsAt: string | null;
  popupEnabled: boolean;
  announcementEnabled: boolean;
  popupFrequency: FirstPurchaseGiftFrequency;
  stackWithDiscountCodes: boolean;
  stackWithSalePrices: boolean;
  currentlyActive: boolean;
  analytics: {
    eligibleCustomers: number;
    usedCustomers: number;
    ordersGenerated: number;
    totalDiscountValue: number;
    revenueGenerated: number;
  };
}

export type UpdateFirstPurchaseGift = Partial<
  Pick<
    FirstPurchaseGiftAdminSettings,
    | 'isActive'
    | 'discountPercent'
    | 'title'
    | 'description'
    | 'startsAt'
    | 'endsAt'
    | 'popupEnabled'
    | 'announcementEnabled'
    | 'popupFrequency'
    | 'stackWithDiscountCodes'
    | 'stackWithSalePrices'
  >
>;

export async function getFirstPurchaseGiftConfig() {
  const { data } = await api.get<{ data: FirstPurchaseGiftConfig }>(
    '/first-purchase-gift/public',
  );
  return data;
}

export async function getFirstPurchaseGiftEligibility() {
  const { data } = await api.get<{ data: FirstPurchaseGiftEligibility }>(
    '/first-purchase-gift/eligibility',
  );
  return data;
}

export async function getFirstPurchaseGiftAdminSettings() {
  const { data } = await api.get<{ data: FirstPurchaseGiftAdminSettings }>(
    '/admin/first-purchase-gift',
  );
  return data;
}

export async function updateFirstPurchaseGiftSettings(
  payload: UpdateFirstPurchaseGift,
) {
  const { data } = await api.patch<{ data: FirstPurchaseGiftAdminSettings }>(
    '/admin/first-purchase-gift',
    payload,
  );
  return data;
}
