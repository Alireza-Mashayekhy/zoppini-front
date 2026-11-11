export enum PromotionType {
  CHEAPER_ITEM_PAIR = 'cheaper_item_pair',
  BUY_X_GET_Y_SAME_GROUP = 'buy_x_get_y_same_group',
  BUY_TRIGGER_GET_REWARD = 'buy_trigger_get_reward',
  SPEND_AND_SAVE = 'spend_and_save',
  BUY_X_GET_PERCENT_OFF = 'buy_x_get_percent_off',
  FIXED_PRICE_BUNDLE = 'fixed_price_bundle',
  FREE_SHIPPING = 'free_shipping',
  CART_DISCOUNT = 'cart_discount',
}

export enum PromotionRewardType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  FREE_ITEM = 'free_item',
  FREE_SHIPPING = 'free_shipping',
  FIXED_BUNDLE_PRICE = 'fixed_bundle_price',
}

export enum PromotionScope {
  ALL = 'all',
  CATEGORIES = 'categories',
  PRODUCTS = 'products',
  CATEGORIES_AND_PRODUCTS = 'categories_and_products',
}

export enum FreeItemSelection {
  AUTO = 'auto',
  CUSTOMER = 'customer',
}

export type PromotionStatus = 'live' | 'scheduled' | 'expired' | 'inactive';

export interface Promotion {
  id: number;
  name: string;
  internalDescription: string | null;
  type: PromotionType;

  scope: PromotionScope;
  productIds: number[];
  categoryIds: number[];
  excludedProductIds: number[];
  excludedCategoryIds: number[];

  rewardType: PromotionRewardType;
  rewardValue: number | null;
  maxDiscountAmount: number | null;

  minQuantity: number;
  minCartValue: number;

  pairSize: number;
  discountEveryExtraUnit: boolean;

  requiredQuantity: number;
  freeQuantity: number;

  rewardScope: PromotionScope | null;
  rewardProductIds: number[];
  rewardCategoryIds: number[];
  suggestedProductId: number | null;
  suggestedCategoryId: number | null;
  rewardQuantity: number;
  freeItemSelection: FreeItemSelection;
  autoAddReward: boolean;
  requiresCustomerAcceptance: boolean;
  removeRewardWhenTriggerRemoved: boolean;

  isActive: boolean;
  startsAt: string;
  expiresAt: string;

  maxTotalUses: number | null;
  maxUsesPerCustomer: number | null;
  maxApplicationsPerCart: number;

  canStack: boolean;
  stackable: boolean;
  priority: number;

  badgeText: string | null;
  customerDescription: string | null;
  showBadgeOnProductCard: boolean;
  showBadgeOnProductPage: boolean;

  showPreCartPopup: boolean;
  popupTitle: string | null;
  popupDescription: string | null;
  popupAcceptLabel: string | null;
  popupDismissLabel: string | null;
  popupSuggestedProductId: number | null;
  popupSuggestedCategoryId: number | null;

  status: PromotionStatus;
  usage?: { total: number; perCustomer: number };
  badgeLabel?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionDto
  extends Omit<
    Promotion,
    | 'id'
    | 'status'
    | 'usage'
    | 'badgeLabel'
    | 'createdAt'
    | 'updatedAt'
    | 'rewardValue'
    | 'maxDiscountAmount'
    | 'minCartValue'
  > {
  rewardValue?: number | null;
  maxDiscountAmount?: number | null;
  minCartValue?: number;
}

export type UpdatePromotionDto = Partial<CreatePromotionDto>;

/** تخفیف یک ردیف سبد */
export interface CartLinePromotion {
  promotionDiscount: number;
  promotionDiscountPerUnit: number;
  isFreeReward: boolean;
  rewardPromotionId: number | null;
  labels: string[];
  promotionIds: number[];
}

export interface PromotionAllocationView {
  lineId: number | string;
  amount: number;
  isFree: boolean;
  label: string;
}

export interface PromotionEvaluationView {
  promotionId: number;
  name: string;
  type: PromotionType;
  qualifies: boolean;
  discountAmount: number;
  freeItemValue: number;
  grantsFreeShipping: boolean;
  message: string | null;
  reasons: string[];
  requiresAction: boolean;
  allocations: PromotionAllocationView[];
  freeItems: {
    productId: number;
    variantId: number | null;
    quantity: number;
    title?: string;
    slug?: string;
    image?: string | null;
    unitPrice: number;
  }[];
}

export interface PromotionSuggestionView {
  promotionId: number;
  title: string;
  description: string | null;
  badgeText: string | null;
  hint: string;
  suggestedProduct: {
    productId: number;
    variantId: number | null;
    title?: string;
    image?: string | null;
    slug?: string;
    price?: number;
  } | null;
  suggestedCategoryId: number | null;
  acceptLabel: string | null;
  dismissLabel: string | null;
  rewardIsFree: boolean;
  requiresSelection: boolean;
  /**
   * نوع اقدام دکمهٔ اصلی:
   * - add_free_reward: هدیهٔ رایگان از مسیر پاداش اضافه می‌شود
   * - add_paid_item: کالای پولی برای کامل کردن شرط اضافه می‌شود (قیمت عادی)
   * - open_cart: فقط راهنمایی؛ افزودن کالای پولی خودکار انجام نمی‌شود
   */
  action: 'add_free_reward' | 'add_paid_item' | 'open_cart';
  stateKey: string;
}

export interface CartPromotionsState {
  applied: PromotionEvaluationView[];
  rejected: PromotionEvaluationView[];
  notices: string[];
  suggestions: PromotionSuggestionView[];
  popupState: {
    shownFor: string | null;
    dismissed: number[];
    accepted: number[];
  };
}

export interface PromotionBadge {
  promotionId: number;
  badgeText: string;
  description: string | null;
  type: PromotionType;
  hint: string;
}

export interface PromotionProductBadge {
  promotionId: number;
  text: string;
}

/** یک استفادهٔ ثبت‌شده از پروموشن (برای گزارش مدیر) */
export interface PromotionRedemptionRow {
  orderId: number;
  orderNumber: string | null;
  userId: number | null;
  discountAmount: number;
  usedAt: string;
}

export interface PreviewPromotionResponse {
  promotion: Promotion;
  state: PromotionStatus;
  sampleCart: {
    lines: {
      lineId: string;
      productId: number;
      title?: string;
      unitPrice: number;
      quantity: number;
    }[];
    cartValue: number;
    itemCount: number;
  };
  evaluation: PromotionEvaluationView | null;
  applied: PromotionEvaluationView[];
  rejected: PromotionEvaluationView[];
  suggestions: PromotionSuggestionView[];
  totals: {
    originalPrice: number;
    promotionDiscount: number;
    freeItemValue: number;
    finalPrice: number;
    freeShipping: boolean;
  };
  warnings: string[];
}
