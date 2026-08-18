'use client';

import Image from 'next/image';

import { CartItem, CartResponse } from '@/services/features/cart/types';
import { ApplyDiscountResponse } from '@/services/features/discounts/types';

interface OrderSummaryProps {
  items: CartItem[];

  appliedDiscount: ApplyDiscountResponse | null;

  shippingCost: number;

  pricing?: CartResponse['pricing'] | null;
}

export default function OrderSummary({
  items,
  pricing,
  appliedDiscount,
  shippingCost,
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

              <p className="text-xs text-gray-500">×{item.quantity}</p>
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-semibold whitespace-nowrap">
                {(
                  Number(item.variant.discountedPrice) * item.quantity
                ).toLocaleString()}{' '}
                تومان
              </span>
              <span
                className={
                  item.variant.discountedPrice
                    ? 'text-xs font-semibold whitespace-nowrap line-through'
                    : 'text-sm font-semibold whitespace-nowrap'
                }
              >
                {(Number(item.variant.price) * item.quantity).toLocaleString()}{' '}
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

        {pricing?.discountPrice && pricing?.discountPrice > 0 && (
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
            {shippingCost > 0
              ? `${shippingCost.toLocaleString()} تومان`
              : 'رایگان'}
          </span>
        </div>

        {/* نهایی */}

        <div className="flex justify-between font-semibold text-base pt-3 border-t">
          <span>قابل پرداخت</span>

          <span>
            {appliedDiscount?.summary?.finalPrice.toLocaleString() ||
              pricing?.finalPrice.toLocaleString()}{' '}
            تومان
          </span>
        </div>
      </div>
    </div>
  );
}
