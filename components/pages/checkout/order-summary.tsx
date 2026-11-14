'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';

import { CartItem, CartResponse } from '@/services/features/cart/types';
import { ApplyDiscountResponse } from '@/services/features/discounts/types';
import { CheckoutPreviewResponse } from '@/services/features/orders/type';

import { resolvePromotionTotals } from './promotion-totals';

interface OrderSummaryProps {
  items: CartItem[];

  appliedDiscount: ApplyDiscountResponse | null;

  shippingCost: number;

  isFreeShipping: boolean;

  hasSelectedAddress: boolean;

  isPickup: boolean;

  pricing?: CartResponse['pricing'] | null;

  /**
   * پیش‌نمایش معتبر سمت سرور. اگر موجود باشد، مبالغ پروموشن/ارسال از همین
   * منبع نمایش داده می‌شوند تا با عدد لحظهٔ ثبت سفارش یکی باشد.
   */
  checkoutPreview?: CheckoutPreviewResponse['data'] | null;

  /** کم و زیاد کردن تعداد؛ عدد کمتر از ۱ یعنی حذف آیتم (مثل سبد خرید) */
  onQuantityChange: (itemId: number, quantity: number) => void;

  onRemoveItem: (itemId: number) => void;

  /** وقتی یک تغییر سبد در حال انجام است، کنترل‌ها غیرفعال می‌شوند */
  isUpdatingCart?: boolean;

  /** مبالغی که از کیف پول داخلی و اعتبار دایاتک انتخاب شده‌اند */
  walletCreditUsed?: number;
  clubCreditUsed?: number;
  gatewayPayable?: number;
}

export default function OrderSummary({
  items,
  pricing,
  appliedDiscount,
  shippingCost,
  isFreeShipping,
  hasSelectedAddress,
  isPickup,
  checkoutPreview,
  onQuantityChange,
  onRemoveItem,
  isUpdatingCart = false,
  walletCreditUsed = 0,
  clubCreditUsed = 0,
  gatewayPayable,
}: OrderSummaryProps) {
  const {
    promotionDiscount,
    freeItemValue: freeItemTotal,
    freeShipping: freeShippingFromPromotion,
    notices: promotionNotices,
    fromServer,
  } = resolvePromotionTotals({ preview: checkoutPreview, pricing });

  /* مبلغ قابل پرداخت: ارسال فقط وقتی اضافه می‌شود که خودمان حسابش می‌کنیم */
  const payableTotal = fromServer
    ? (checkoutPreview?.totals.finalPrice ?? 0)
    : (appliedDiscount?.summary?.finalPrice || pricing?.finalPrice || 0) +
      shippingCost;

  return (
    <div dir="rtl" className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
      <h2 className="text-xl font-light tracking-wide mb-4">خلاصه سفارش</h2>

      {/* محصولات */}

      <div className="space-y-3 max-h-60 overflow-y-auto">
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-center gap-3 border-b last:border-b-0 pb-3"
          >
            <div className="relative w-12 h-12 shrink-0 bg-gray-100 rounded-md overflow-hidden">
              <Image
                src={
                  process.env.NEXT_PUBLIC_IMAGE_URL +
                  (item.variant.product.image || '')
                }
                alt={item.variant.product.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {item.variant.product.title}
              </p>

              <p className="text-xs text-gray-500">
                {item.variant.color?.name} / {item.variant.size?.name}
              </p>

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 rounded-md border">
                  <button
                    type="button"
                    aria-label="کاهش تعداد"
                    className="px-2 py-1 hover:bg-gray-100 disabled:opacity-40"
                    disabled={isUpdatingCart}
                    onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="w-7 text-center text-sm">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    aria-label="افزایش تعداد"
                    className="px-2 py-1 hover:bg-gray-100 disabled:opacity-40"
                    disabled={
                      isUpdatingCart ||
                      (!!item.variant.stock &&
                        item.quantity >= item.variant.stock)
                    }
                    onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  aria-label="حذف از سبد خرید"
                  title="حذف از سبد خرید"
                  className="p-1.5 text-red-500 hover:text-red-700 disabled:opacity-40"
                  disabled={isUpdatingCart}
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col items-end">
              {item.promotion?.isFreeReward ? (
                <>
                  <span className="bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                    رایگان
                  </span>
                  <del className="text-[11px] text-gray-400">
                    {(
                      Number(item.variant.price) * item.quantity
                    ).toLocaleString()}{' '}
                    تومان
                  </del>
                </>
              ) : (
                <>
                  {!!item.promotion?.promotionDiscount && (
                    <span className="text-sm font-semibold whitespace-nowrap">
                      {(
                        Number(
                          item.variant.originalPrice ?? item.variant.price,
                        ) *
                          item.quantity -
                        item.promotion.promotionDiscount
                      ).toLocaleString()}{' '}
                      تومان
                    </span>
                  )}
                </>
              )}

              {!item.promotion?.isFreeReward &&
                item.promotion?.labels?.map(label => (
                  <span
                    key={label}
                    className="mt-1 text-[10px] font-medium text-green-700"
                  >
                    {label}
                  </span>
                ))}

              {!item.promotion?.promotionDiscount &&
                !item.promotion?.isFreeReward &&
                !!item.variant.discount &&
                item.variant?.discountedPrice !==
                  item.variant.originalPrice && (
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {(
                      Number(item.variant.discountedPrice) * item.quantity
                    ).toLocaleString()}{' '}
                    تومان
                  </span>
                )}
              {!item.promotion?.isFreeReward && (
                <span
                  className={
                    (item.variant.discount &&
                      item.variant?.discountedPrice !==
                        item.variant.originalPrice) ||
                    !!item.promotion?.promotionDiscount
                      ? 'text-xs font-semibold whitespace-nowrap line-through'
                      : 'text-sm font-semibold whitespace-nowrap'
                  }
                >
                  {(
                    Number(item.variant.originalPrice ?? item.variant.price) *
                    item.quantity
                  ).toLocaleString()}{' '}
                  تومان
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* قیمت‌ها */}

      <div className="border-t mt-4 pt-4 space-y-3 text-sm">
        {/* جمع سبد */}

        <div className="flex justify-between">
          <span className="text-gray-600">جمع سبد</span>

          <span>
            {appliedDiscount?.summary?.originalPrice.toLocaleString() ||
              pricing?.originalPrice.toLocaleString()}{' '}
            تومان
          </span>
        </div>

        {/* تخفیف فروش ویژه / کد */}

        {!!pricing?.discountPrice && pricing?.discountPrice > 0 && (
          <div className="flex justify-between text-green-600">
            <span>تخفیف</span>

            <span>
              -{' '}
              {appliedDiscount?.summary?.discountPrice.toLocaleString() ||
                pricing?.discountPrice.toLocaleString()}{' '}
              تومان
            </span>
          </div>
        )}

        {/* تخفیف پروموشن‌ها */}

        {promotionDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>تخفیف پیشنهادهای ویژه</span>
            <span>- {promotionDiscount.toLocaleString()} تومان</span>
          </div>
        )}

        {/* هدیهٔ اولین خرید */}

        {Number(checkoutPreview?.totals.firstPurchaseGiftDiscount ?? 0) > 0 && (
          <div className="flex justify-between text-rose-800">
            <span>هدیهٔ اولین خرید آنلاین</span>
            <span>
              -{' '}
              {Number(
                checkoutPreview?.totals.firstPurchaseGiftDiscount ?? 0,
              ).toLocaleString()}{' '}
              تومان
            </span>
          </div>
        )}

        {/* کالای رایگان */}

        {freeItemTotal > 0 && (
          <div className="flex justify-between text-green-600">
            <span>کالای رایگان</span>
            <span>- {freeItemTotal.toLocaleString()} تومان</span>
          </div>
        )}

        {/* ارسال */}

        <div className="flex justify-between">
          <span className="text-gray-600">هزینه ارسال</span>

          <span>
            {isPickup || isFreeShipping || freeShippingFromPromotion
              ? 'رایگان'
              : !hasSelectedAddress
                ? 'پس از انتخاب آدرس'
                : shippingCost > 0
                  ? `${shippingCost.toLocaleString()} تومان`
                  : 'پس‌کرایه'}
          </span>
        </div>

        {/* نهایی */}

        <div className="flex justify-between font-semibold text-base pt-3 border-t">
          <span>
            {walletCreditUsed > 0 || clubCreditUsed > 0
              ? 'جمع فاکتور'
              : 'قابل پرداخت'}
          </span>

          <span>{payableTotal.toLocaleString()} تومان</span>
        </div>

        {walletCreditUsed > 0 && (
          <div className="flex justify-between text-green-700">
            <span>پرداخت از کیف پول</span>
            <span>- {walletCreditUsed.toLocaleString()} تومان</span>
          </div>
        )}

        {clubCreditUsed > 0 && (
          <div className="flex justify-between text-green-700">
            <span>اعتبار باشگاه مشتریان</span>
            <span>- {clubCreditUsed.toLocaleString()} تومان</span>
          </div>
        )}

        {gatewayPayable !== undefined &&
          (walletCreditUsed > 0 || clubCreditUsed > 0) && (
            <div className="flex justify-between border-t pt-3 font-semibold text-base">
              <span>پرداخت از درگاه</span>
              <span>{gatewayPayable.toLocaleString()} تومان</span>
            </div>
          )}

        {!!promotionNotices.length && (
          <ul className="space-y-1 border-t pt-3">
            {promotionNotices.map(notice => (
              <li key={notice} className="text-[11px] leading-5 text-amber-700">
                {notice}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
