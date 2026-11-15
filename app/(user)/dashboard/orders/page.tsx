// app/dashboard/orders/page.tsx
'use client';

import { Package, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import OrderItem from '@/components/dashboard/order-item';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrders } from '@/services/features/orders/hooks';

/**
 * فهرست سفارش‌ها.
 *
 * پارامترِ `?order=<id>` (که از کارت‌های داشبورد می‌آید) همان سفارش را باز و
 * به آن اسکرول می‌کند تا «باز کردن سفارش» از داشبورد به صفحه‌ی درست ختم شود.
 */
export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersList />
    </Suspense>
  );
}

function OrdersList() {
  const params = useSearchParams();
  const { data: orders, isLoading, isError, refetch, isFetching } = useOrders();

  const requestedOrderId = Number(params.get('order'));
  const pinnedOrderId =
    Number.isFinite(requestedOrderId) && requestedOrderId > 0
      ? requestedOrderId
      : null;

  /**
   * سفارشی که از داشبورد آمده همان ابتدا باز است؛ بعد از آن کاربر با کلیک
   * تعیین می‌کند کدام سفارش باز باشد. (مقدارِ اولیه از پارامترِ URL خوانده
   * می‌شود تا نیازی به ست کردنِ state در اثرِ جانبی نباشد.)
   */
  const [expandedId, setExpandedId] = useState<number | null>(pinnedOrderId);

  const containerRef = useRef<HTMLDivElement>(null);

  // فقط اسکرول به سفارشِ درخواست‌شده (بدون تغییرِ state در اثرِ جانبی)
  useEffect(() => {
    if (!pinnedOrderId) return;

    const node = containerRef.current?.querySelector<HTMLElement>(
      `[data-order-id="${pinnedOrderId}"]`,
    );

    node?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [pinnedOrderId]);

  if (isLoading) return <OrdersSkeleton />;

  if (isError) {
    return (
      <div
        dir="rtl"
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-white p-12 text-center"
      >
        <Package className="h-12 w-12 stroke-1 text-gray-300" />
        <h2 className="text-lg font-light">سفارش‌ها دریافت نشد</h2>
        <p className="text-sm text-gray-500">
          ارتباط با سرور برقرار نشد. دوباره تلاش کنید.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          loading={isFetching}
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  if (!orders || orders.data.length === 0) {
    return (
      <div
        dir="rtl"
        className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-white p-16 text-center"
      >
        <Package className="mb-3 h-14 w-14 stroke-1 text-gray-300" />
        <h2 className="text-xl font-light">هیچ سفارشی ثبت نشده است</h2>
        <p className="text-sm text-gray-500">شما هنوز سفارشی ثبت نکرده‌اید</p>
        <Button asChild variant="dark" size="sm" className="mt-4">
          <Link href="/products">شروع خرید</Link>
        </Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-light tracking-wide">سفارشات من</h1>
        <p className="text-sm text-gray-500">
          برای دیدن جزئیات و انجام کارهای لازم، روی هر سفارش بزنید.
        </p>
      </div>

      <div ref={containerRef} className="space-y-3">
        {orders.data.map(order => (
          <div key={order.id} data-order-id={order.id}>
            <OrderItem
              order={order}
              expanded={expandedId === order.id}
              onToggle={() =>
                setExpandedId(current => (current === order.id ? null : order.id))
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div dir="rtl" className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
