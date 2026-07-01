// components/dashboard/order-item.tsx
'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';
import { useCancelOrder } from '@/services/features/orders/hooks';
import { OrderResponse, OrderStatus } from '@/services/features/orders/type';

const statusMap: Record<OrderStatus, { label: string; color: string }> = {
  pending: {
    label: 'در انتظار پرداخت',
    color: 'bg-yellow-100 text-yellow-800',
  },
  paid: { label: 'پرداخت شده', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'ارسال شده', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'تحویل شده', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'لغو شده', color: 'bg-red-100 text-red-800' },
};

interface OrderItemProps {
  order: OrderResponse;
}

export default function OrderItem({ order }: OrderItemProps) {
  const [expanded, setExpanded] = useState(false);
  const cancelOrder = useCancelOrder();

  const status = statusMap[order.status];
  const canCancel =
    order.status === OrderStatus.PENDING || order.status === OrderStatus.PAID;

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* هدر سفارش */}
      <div
        className="flex flex-wrap items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm font-medium">
            {order.orderNumber}
          </span>
          <span
            className={cn('text-xs px-2 py-0.5 rounded-full', status.color)}
          >
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>{new Date(order.createdAt).toLocaleDateString('fa-IR')}</span>
          <span className="font-semibold">
            {formatPrice(order.finalPrice)} تومان
          </span>
          <button className="p-1 hover:bg-gray-100 rounded">
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* جزئیات سفارش (expandable) */}
      {expanded && (
        <div className="p-4 border-t space-y-4">
          <div className="space-y-2">
            {order.items.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2 border-b last:border-0"
              >
                <div className="relative w-14 h-14 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                  <Image
                    src={
                      process.env.NEXT_PUBLIC_IMAGE_URL +
                      (item.variant.product.image || 'placeholder.jpg')
                    }
                    alt={item.variant.product.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {item.variant.product.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.variant.color?.name} / {item.variant.size?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatPrice(item.price * item.quantity)} تومان
                  </p>
                  <p className="text-xs text-gray-500">
                    تعداد: {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-between items-center pt-2 border-t">
            <div className="space-y-1 text-sm">
              <p>آدرس: {order.shippingAddress || 'ثبت نشده'}</p>
              <p>تلفن: {order.phone || 'ثبت نشده'}</p>
              {order.note && <p>توضیحات: {order.note}</p>}
            </div>
            <div className="text-sm space-y-1 text-left">
              <p>جمع سفارش: {formatPrice(order.totalPrice)} تومان</p>
              <p>هزینه ارسال: {formatPrice(order.shippingCost)} تومان</p>
              {order.discount > 0 && (
                <p>تخفیف: {formatPrice(order.discount)} تومان</p>
              )}
              <p className="font-semibold text-base">
                قابل پرداخت: {formatPrice(order.finalPrice)} تومان
              </p>
            </div>
          </div>

          {canCancel && (
            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancelOrder.mutate(order.id)}
                loading={cancelOrder.isPending}
              >
                لغو سفارش
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
