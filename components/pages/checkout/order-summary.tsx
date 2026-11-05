'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';

import { CartItem, CartResponse } from '@/services/features/cart/types';
import { ApplyDiscountResponse } from '@/services/features/discounts/types';

interface OrderSummaryProps {
  items: CartItem[];

  appliedDiscount: ApplyDiscountResponse | null;

  shippingCost: number;

  isFreeShipping: boolean;

  hasSelectedAddress: boolean;

  isPickup: boolean;

  pricing?: CartResponse['pricing'] | null;

  /** کم و زیاد کردن تعداد؛ عدد کمتر از ۱ یعنی حذف آیتم (مثل سبد خرید) */
  onQuantityChange: (itemId: number, quantity: number) => void;

  onRemoveItem: (itemId: number) => void;

  /** وقتی یک تغییر سبد در حال انجام است، کنترل‌ها غیرفعال می‌شوند */
  isUpdatingCart?: boolean;
}

export default function OrderSummary({
  items,
  pricing,
  appliedDiscount,
  shippingCost,
  isFreeShipping,
  hasSelectedAddress,
  isPickup,
  onQuantityChange,
  onRemoveItem,
  isUpdatingCart = false,
}: OrderSummaryProps) {
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

            <div className="flex flex-col">
              {!!item.variant.discount &&
                item.variant?.discountedPrice !==
                  item.variant.originalPrice && (
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {(
                      Number(item.variant.discountedPrice) * item.quantity
                    ).toLocaleString()}{' '}
                    تومان
                  </span>
                )}
              <span
                className={
                  item.variant.discount &&
                  item.variant?.discountedPrice !== item.variant.originalPrice
                    ? 'text-xs font-semibold whitespace-nowrap line-through'
                    : 'text-sm font-semibold whitespace-nowrap'
                }
              >
                {(
                  Number(item.variant.originalPrice) * item.quantity
                ).toLocaleString()}{' '}
                تومان
              </span>
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

        {/* تخفیف */}

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

        {/* ارسال */}

        <div className="flex justify-between">
          <span className="text-gray-600">هزینه ارسال</span>

          <span>
            {isPickup || isFreeShipping
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
          <span>قابل پرداخت</span>

          <span>
            {(
              (appliedDiscount?.summary?.finalPrice ||
                pricing?.finalPrice ||
                0) + shippingCost
            ).toLocaleString()}{' '}
            تومان
          </span>
        </div>
      </div>
    </div>
  );
}
