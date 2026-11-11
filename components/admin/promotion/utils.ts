import {
  PromotionRewardType,
  PromotionStatus,
  PromotionType,
} from '@/services/features/promotions/types';

export const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  [PromotionType.CHEAPER_ITEM_PAIR]:
    'خرید تعداد زوج و تخفیف ارزان‌ترها',
  [PromotionType.BUY_X_GET_Y_SAME_GROUP]:
    'خرید X، دریافت Y رایگان از همان گروه',
  [PromotionType.BUY_TRIGGER_GET_REWARD]:
    'خرید کالای محرک، دریافت کالای دیگر رایگان',
  [PromotionType.SPEND_AND_SAVE]: 'خرید به‌اندازه و تخفیف',
  [PromotionType.BUY_X_GET_PERCENT_OFF]: 'خرید X کالا و درصد تخفیف',
  [PromotionType.FIXED_PRICE_BUNDLE]: 'باندل با قیمت ثابت',
  [PromotionType.FREE_SHIPPING]: 'ارسال رایگان',
  [PromotionType.CART_DISCOUNT]: 'تخفیف عمومی سبد',
};

export const PROMOTION_TYPE_HINTS: Record<PromotionType, string> = {
  [PromotionType.CHEAPER_ITEM_PAIR]:
    'برای هر جفت کامل از کالاهای مشمول، یک واحد (ارزان‌تر) تخفیف می‌گیرد. ۴ کالا ⇒ ۲ واحد، ۶ کالا ⇒ ۳ واحد.',
  [PromotionType.BUY_X_GET_Y_SAME_GROUP]:
    'با خرید X کالا از گروه مشمول، Y کالا از همان گروه (ارزان‌ترین) رایگان می‌شود.',
  [PromotionType.BUY_TRIGGER_GET_REWARD]:
    'با خرید از کالاهای محرک، کالای هدیه (از لیست پاداش) رایگان به سبد اضافه می‌شود؛ می‌توانید انتخاب را به مشتری بسپارید.',
  [PromotionType.SPEND_AND_SAVE]:
    'اگر مبلغ سبد به حداقل برسد، درصد یا مبلغ ثابتی از کل سبد کم می‌شود.',
  [PromotionType.BUY_X_GET_PERCENT_OFF]:
    'اگر تعداد کالاهای مشمول به حداقل برسد، درصد/مبلغ تخفیف روی همان کالاها اعمال می‌شود.',
  [PromotionType.FIXED_PRICE_BUNDLE]:
    'تعداد مشخصی از کالاهای مشمول با یک قیمت ثابت (مثلاً ست کت و پیراهن) فروخته می‌شود.',
  [PromotionType.FREE_SHIPPING]:
    'هزینهٔ ارسال سفارش صفر می‌شود؛ بر اساس مبلغ سبد یا دسته‌های انتخابی.',
  [PromotionType.CART_DISCOUNT]:
    'تخفیف درصدی یا مبلغ ثابت روی کل سبد با قواعد شمول قابل تنظیم.',
};

export const REWARD_TYPE_LABELS: Record<PromotionRewardType, string> = {
  [PromotionRewardType.PERCENTAGE]: 'درصد تخفیف',
  [PromotionRewardType.FIXED]: 'مبلغ ثابت (تومان)',
  [PromotionRewardType.FREE_ITEM]: 'کالای رایگان',
  [PromotionRewardType.FREE_SHIPPING]: 'ارسال رایگان',
  [PromotionRewardType.FIXED_BUNDLE_PRICE]: 'قیمت ثابت باندل',
};

export const STATUS_LABELS: Record<PromotionStatus, string> = {
  live: 'در حال اجرا',
  scheduled: 'زمان‌بندی‌شده',
  expired: 'منقضی',
  inactive: 'غیرفعال',
};

export const STATUS_CLASSES: Record<PromotionStatus, string> = {
  live: 'bg-green-50 text-green-700 border-green-200',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
  inactive: 'bg-amber-50 text-amber-700 border-amber-200',
};

/** کدام نوع پاداش برای این نوع پروموشن معنا دارد */
export function rewardTypesFor(type: PromotionType): PromotionRewardType[] {
  switch (type) {
    case PromotionType.CHEAPER_ITEM_PAIR:
    case PromotionType.BUY_X_GET_PERCENT_OFF:
    case PromotionType.CART_DISCOUNT:
    case PromotionType.SPEND_AND_SAVE:
      return [PromotionRewardType.PERCENTAGE, PromotionRewardType.FIXED];

    case PromotionType.BUY_X_GET_Y_SAME_GROUP:
    case PromotionType.BUY_TRIGGER_GET_REWARD:
      return [PromotionRewardType.FREE_ITEM];

    case PromotionType.FIXED_PRICE_BUNDLE:
      return [PromotionRewardType.FIXED_BUNDLE_PRICE];

    case PromotionType.FREE_SHIPPING:
      return [PromotionRewardType.FREE_SHIPPING];

    default:
      return [PromotionRewardType.PERCENTAGE, PromotionRewardType.FIXED];
  }
}

/** توضیح کوتاه فارسی از پیکربندی فعلی — برای جدول و پیش‌نمایش */
export function describeConfiguration(promotion: {
  type: PromotionType;
  rewardType: PromotionRewardType;
  rewardValue: number | null;
  pairSize: number;
  requiredQuantity: number;
  freeQuantity: number;
  rewardQuantity: number;
  minQuantity: number;
  minCartValue: number;
}): string {
  const percent = Number(promotion.rewardValue ?? 0);
  const price = Number(promotion.rewardValue ?? 0).toLocaleString('fa-IR');

  switch (promotion.type) {
    case PromotionType.CHEAPER_ITEM_PAIR:
      return `خرید ${promotion.pairSize}، ${percent}٪ تخفیف روی ارزان‌تر`;

    case PromotionType.BUY_X_GET_Y_SAME_GROUP:
      return `خرید ${promotion.requiredQuantity}، ${promotion.freeQuantity} رایگان`;

    case PromotionType.BUY_TRIGGER_GET_REWARD:
      return `خرید ${promotion.minQuantity || 1}، ${promotion.rewardQuantity} هدیه`;

    case PromotionType.SPEND_AND_SAVE:
      return `${price} تومان خرید ⇒ ${percent}٪ تخفیف`;

    case PromotionType.BUY_X_GET_PERCENT_OFF:
      return `${promotion.minQuantity} کالا ⇒ ${percent}٪ تخفیف`;

    case PromotionType.FIXED_PRICE_BUNDLE:
      return `${promotion.minQuantity} کالا ⇒ ${price} تومان`;

    case PromotionType.FREE_SHIPPING:
      return `ارسال رایگان از ${promotion.minCartValue.toLocaleString('fa-IR')} تومان`;

    case PromotionType.CART_DISCOUNT:
      return `${percent}٪ تخفیف سبد`;

    default:
      return '';
  }
}

export function formatNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    return '۰';
  }

  return new Intl.NumberFormat('fa-IR').format(parsed);
}

export function formatPrice(value: number | string | null | undefined) {
  return `${formatNumber(value)} تومان`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short' }).format(date);
}
