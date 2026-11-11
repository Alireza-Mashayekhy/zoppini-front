import {
  CreatePromotionDto,
  FreeItemSelection,
  PromotionRewardType,
  PromotionScope,
  PromotionType,
} from '@/services/features/promotions/types';

/** شکل دادهٔ فرم پروموشن (تاریخ‌ها به فرمت جلالی و مبلغ‌ها رشته‌ای هستند) */
export interface PromotionFormValues {
  name: string;
  internalDescription: string;
  type: PromotionType;

  scope: PromotionScope;
  productIds: number[];
  categoryIds: number[];
  excludedProductIds: number[];
  excludedCategoryIds: number[];

  rewardType: PromotionRewardType;
  /** درصد یا مبلغ؛ به تومان/درصد */
  rewardValue: number | '';
  maxDiscountAmount: number | '';

  minQuantity: number | '';
  minCartValue: number | '';

  pairSize: number;
  discountEveryExtraUnit: boolean;

  requiredQuantity: number;
  freeQuantity: number;

  rewardScope: PromotionScope;
  rewardProductIds: number[];
  rewardCategoryIds: number[];
  suggestedProductId: number | '';
  suggestedCategoryId: number | '';
  rewardQuantity: number;
  freeItemSelection: FreeItemSelection;
  autoAddReward: boolean;
  requiresCustomerAcceptance: boolean;
  removeRewardWhenTriggerRemoved: boolean;

  isActive: boolean;
  /** تاریخ شمسی (YYYY/MM/DD) */
  startsAt: string;
  expiresAt: string;
  /** ساعت شروع/پایان (HH:mm) */
  startsAtTime: string;
  expiresAtTime: string;

  maxTotalUses: number | '';
  maxUsesPerCustomer: number | '';
  maxApplicationsPerCart: number;

  canStack: boolean;
  stackable: boolean;
  priority: number;

  badgeText: string;
  customerDescription: string;
  showBadgeOnProductCard: boolean;
  showBadgeOnProductPage: boolean;

  showPreCartPopup: boolean;
  popupTitle: string;
  popupDescription: string;
  popupAcceptLabel: string;
  popupDismissLabel: string;
  popupSuggestedProductId: number | '';
  popupSuggestedCategoryId: number | '';
}

export const EMPTY_PROMOTION_FORM: PromotionFormValues = {
  name: '',
  internalDescription: '',
  type: PromotionType.CHEAPER_ITEM_PAIR,

  scope: PromotionScope.ALL,
  productIds: [],
  categoryIds: [],
  excludedProductIds: [],
  excludedCategoryIds: [],

  rewardType: PromotionRewardType.PERCENTAGE,
  rewardValue: 50,
  maxDiscountAmount: '',

  minQuantity: '',
  minCartValue: '',

  pairSize: 2,
  discountEveryExtraUnit: false,

  requiredQuantity: 2,
  freeQuantity: 1,

  rewardScope: PromotionScope.PRODUCTS,
  rewardProductIds: [],
  rewardCategoryIds: [],
  suggestedProductId: '',
  suggestedCategoryId: '',
  rewardQuantity: 1,
  freeItemSelection: FreeItemSelection.AUTO,
  autoAddReward: false,
  requiresCustomerAcceptance: true,
  removeRewardWhenTriggerRemoved: true,

  isActive: true,
  startsAt: '',
  expiresAt: '',
  startsAtTime: '00:00',
  expiresAtTime: '23:59',

  maxTotalUses: '',
  maxUsesPerCustomer: '',
  maxApplicationsPerCart: 1,

  canStack: false,
  stackable: false,
  priority: 0,

  badgeText: '',
  customerDescription: '',
  showBadgeOnProductCard: true,
  showBadgeOnProductPage: true,

  showPreCartPopup: false,
  popupTitle: '',
  popupDescription: '',
  popupAcceptLabel: 'افزودن به سبد',
  popupDismissLabel: 'نه ممنون',
  popupSuggestedProductId: '',
  popupSuggestedCategoryId: '',
};

/**
 * تبدیل دادهٔ فرم (جلالی/رشته‌ای) به DTO سرور.
 * تاریخ‌ها با ساعت ترکیب می‌شوند تا بازهٔ دقیق ذخیره شود.
 */
export function toPromotionDto(
  values: PromotionFormValues,
  helpers: {
    persianToIso: (persianDate: string, time: string) => string;
  },
): CreatePromotionDto {
  /**
   * ورودی‌های عددی خالی با `valueAsNumber` مقدار NaN می‌دهند؛ NaN در JSON به
   * null تبدیل می‌شود و پیام خطای سرور گیج‌کننده می‌شود. اینجا صریحاً آن را
   * «تعیین‌نشده» می‌کنیم تا فیلد اختیاری واقعاً خالی بماند.
   */
  const toNumber = (value: number | '') => {
    if (value === '' || value == null) {
      return undefined;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return {
    name: values.name.trim(),
    internalDescription: values.internalDescription.trim() || null,
    type: values.type,

    scope: values.scope,
    productIds: values.productIds,
    categoryIds: values.categoryIds,
    excludedProductIds: values.excludedProductIds,
    excludedCategoryIds: values.excludedCategoryIds,

    rewardType: values.rewardType,
    rewardValue: toNumber(values.rewardValue) ?? null,
    maxDiscountAmount: toNumber(values.maxDiscountAmount) ?? null,

    minQuantity: toNumber(values.minQuantity) ?? 0,
    minCartValue: toNumber(values.minCartValue) ?? 0,

    pairSize: values.pairSize,
    discountEveryExtraUnit: values.discountEveryExtraUnit,

    requiredQuantity: values.requiredQuantity,
    freeQuantity: values.freeQuantity,

    rewardScope: values.rewardScope,
    rewardProductIds: values.rewardProductIds,
    rewardCategoryIds: values.rewardCategoryIds,
    suggestedProductId: toNumber(values.suggestedProductId) ?? null,
    suggestedCategoryId: toNumber(values.suggestedCategoryId) ?? null,
    rewardQuantity: values.rewardQuantity,
    freeItemSelection: values.freeItemSelection,
    autoAddReward: values.autoAddReward,
    requiresCustomerAcceptance: values.requiresCustomerAcceptance,
    removeRewardWhenTriggerRemoved: values.removeRewardWhenTriggerRemoved,

    isActive: values.isActive,
    /*
     * تاریخ‌ها برای «ایجاد» الزامی‌اند (DTO سرور هم DateString می‌خواهد).
     * فرم با `required` جلوی ارسال خالی را می‌گیرد؛ در ویرایش مقدار فعلی
     * پروموشن از قبل در فرم نشسته است.
     */
    startsAt: helpers.persianToIso(values.startsAt, values.startsAtTime),
    expiresAt: helpers.persianToIso(values.expiresAt, values.expiresAtTime),

    maxTotalUses: toNumber(values.maxTotalUses) ?? null,
    maxUsesPerCustomer: toNumber(values.maxUsesPerCustomer) ?? null,
    maxApplicationsPerCart: values.maxApplicationsPerCart,

    canStack: values.canStack,
    stackable: values.stackable || values.canStack,
    priority: values.priority,

    badgeText: values.badgeText.trim() || null,
    customerDescription: values.customerDescription.trim() || null,
    showBadgeOnProductCard: values.showBadgeOnProductCard,
    showBadgeOnProductPage: values.showBadgeOnProductPage,

    showPreCartPopup: values.showPreCartPopup,
    popupTitle: values.popupTitle.trim() || null,
    popupDescription: values.popupDescription.trim() || null,
    popupAcceptLabel: values.popupAcceptLabel.trim() || null,
    popupDismissLabel: values.popupDismissLabel.trim() || null,
    popupSuggestedProductId: toNumber(values.popupSuggestedProductId) ?? null,
    popupSuggestedCategoryId: toNumber(values.popupSuggestedCategoryId) ?? null,
  };
}

/** مقدار پیش‌فرض پاداش را با نوع پروموشن هماهنگ می‌کند */
export function normalizeRewardType(
  type: PromotionType,
  current: PromotionRewardType,
): PromotionRewardType {
  switch (type) {
    case PromotionType.BUY_X_GET_Y_SAME_GROUP:
    case PromotionType.BUY_TRIGGER_GET_REWARD:
      return PromotionRewardType.FREE_ITEM;

    case PromotionType.FIXED_PRICE_BUNDLE:
      return PromotionRewardType.FIXED_BUNDLE_PRICE;

    case PromotionType.FREE_SHIPPING:
      return PromotionRewardType.FREE_SHIPPING;

    default:
      return current === PromotionRewardType.FREE_ITEM
        ? PromotionRewardType.PERCENTAGE
        : current;
  }
}
