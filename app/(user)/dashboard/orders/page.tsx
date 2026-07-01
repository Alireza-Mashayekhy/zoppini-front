// app/dashboard/orders/page.tsx
'use client';

import { Package } from 'lucide-react';

import OrderItem from '@/components/dashboard/order-item';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrders } from '@/services/features/orders/hooks';

export default function OrdersPage() {
  const { data: orders, isLoading } = useOrders();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!orders || orders?.data?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Package className="w-16 h-16 stroke-1 mb-4" />
        <h2 className="text-xl font-light">هیچ سفارشی ثبت نشده است</h2>
        <p className="text-sm mt-2">شما هنوز سفارشی ثبت نکرده‌اید</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-light tracking-wide">سفارشات من</h1>
      <div className="space-y-3">
        {orders?.data?.map(order => (
          <OrderItem key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
