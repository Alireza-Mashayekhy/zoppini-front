// components/pages/checkout/order-summary.tsx
'use client';

import Image from 'next/image';

import { CartItem } from '@/services/features/cart/types';

interface OrderSummaryProps {
  items: CartItem[];
  totalPrice: number;
  shippingCost: number;
  finalPrice: number;
}

export default function OrderSummary({
  items,
  totalPrice,
  shippingCost,
  finalPrice,
}: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
      <h2 className="text-xl font-light tracking-wide mb-4">خلاصه سفارش</h2>

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
            <span className="text-sm font-semibold whitespace-nowrap">
              {(item.variant.price * item.quantity).toLocaleString()} تومان
            </span>
          </div>
        ))}
      </div>

      <div className="border-t mt-4 pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">جمع سبد</span>
          <span>{totalPrice.toLocaleString()} تومان</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">هزینه ارسال</span>
          <span>{shippingCost.toLocaleString()} تومان</span>
        </div>
        <div className="flex justify-between font-semibold text-base pt-2 border-t">
          <span>قابل پرداخت</span>
          <span>{finalPrice.toLocaleString()} تومان</span>
        </div>
      </div>
    </div>
  );
}
