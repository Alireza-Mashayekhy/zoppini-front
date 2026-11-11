import { CartResponse } from '@/services/features/cart/types';
import { CheckoutPreviewResponse } from '@/services/features/orders/type';

export interface PromotionTotalsInput {
  /** پیش‌نمایش معتبر سمت سرور (اگر هنوز بارگذاری نشده، null) */
  preview?: CheckoutPreviewResponse['data'] | null;
  /** سبد (پشتیبان؛ ممکن است چند ثانیه قدیمی‌تر باشد) */
  pricing?: CartResponse['pricing'] | null;
}

export interface PromotionTotals {
  promotionDiscount: number;
  freeItemValue: number;
  freeShipping: boolean;
  /** جمع سبد منهای تخفیف‌ها، بدون هزینهٔ ارسال */
  payableBeforeShipping: number;
  notices: string[];
  /**
   * مبالغ از پیش‌نمایش سرور آمده‌اند (نه از سبد).
   * برای نمایش «مبلغ نهایی» از همین پرچم استفاده می‌شود تا هزینهٔ ارسال
   * دوبار اضافه نشود.
   */
  fromServer: boolean;
}

/**
 * انتخاب منبع اعداد چک‌اوت.
 *
 * قاعده: پیش‌نمایش سرور بر سبد اولویت دارد، چون بازهٔ زمانی پروموشن و
 * موجودی می‌تواند بعد از بارگذاری سبد تغییر کرده باشد و عددی که مشتری
 * می‌بیند باید نزدیک‌ترین عدد به لحظهٔ ثبت سفارش باشد. سبد فقط جانشین
 * موقت است تا پیش‌نمایش برسد.
 */
export function resolvePromotionTotals({
  preview,
  pricing,
}: PromotionTotalsInput): PromotionTotals {
  if (preview) {
    return {
      promotionDiscount: preview.totals.promotionDiscount,
      freeItemValue: preview.totals.freeItemValue,
      freeShipping: preview.totals.freeShipping,
      payableBeforeShipping: Math.max(
        0,
        preview.totals.finalPrice - preview.totals.shippingCost,
      ),
      notices: preview.promotions.notices ?? [],
      fromServer: true,
    };
  }

  const promotionDiscount = pricing?.promotionDiscountPrice ?? 0;
  const freeItemValue = pricing?.freeItemValue ?? 0;

  return {
    promotionDiscount,
    freeItemValue,
    freeShipping: pricing?.freeShipping ?? false,
    payableBeforeShipping: Math.max(0, pricing?.finalPrice ?? 0),
    notices: [],
    fromServer: false,
  };
}

/** جمع تخفیف‌های نمایش‌داده‌شده به مشتری (فروش ویژه + پروموشن) */
export function totalVisibleSavings(totals: {
  saleDiscount: number;
  promotionDiscount: number;
  freeItemValue: number;
}) {
  return (
    Math.max(0, totals.saleDiscount) +
    Math.max(0, totals.promotionDiscount) +
    Math.max(0, totals.freeItemValue)
  );
}
