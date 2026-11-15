'use client';

import { ChevronLeft, Package, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import CancelOrderDialog from '@/components/dashboard/cancel-order-dialog';
import OrderPayment, { canPayOrderOnline } from '@/components/dashboard/order-payment';
import OrderStatusBadge from '@/components/dashboard/order-status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  canCancelOrder,
  getOrderStatusMeta,
  needsWalletConfirmation,
} from '@/lib/order-status';
import { cn, formatPrice, toPersianDate } from '@/lib/utils';
import { useConfirmOrderFromWallet } from '@/services/features/orders/hooks';
import { OrderResponse } from '@/services/features/orders/type';

/**
 * فهرست سفارش‌های اخیرِ داشبورد.
 *
 * هر سفارش علاوه بر شماره، تاریخ، مبلغ و وضعیت، «گام بعدیِ» مشتری را هم نشان
 * می‌دهد: برای سفارشِ در انتظار پرداخت، دکمه‌های «پرداخت سفارش» و «لغو
 * سفارش» در دسترس‌اند و برای بقیه فقط لینکِ مشاهده‌ی جزئیات.
 *
 * چرا کارت به‌جای جدول: در RTL و روی موبایل جدول‌ها سرریز می‌کنند و شماره‌ی
 * سفارش‌های بلند بیرون می‌زنند؛ کارت روی همه‌ی اندازه‌ها خوانا می‌ماند.
 */

interface RecentOrdersProps {
  orders: OrderResponse[] | null | undefined;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isFetching?: boolean;
}

export function RecentOrders({
  orders,
  isLoading,
  isError = false,
  onRetry,
  isFetching = false,
}: RecentOrdersProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <span className="sr-only">در حال دریافت سفارش‌ها…</span>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-white p-8 text-center">
        <Package className="h-10 w-10 text-gray-300" strokeWidth={1} />
        <p className="text-sm text-gray-500">
          سفارش‌های شما دریافت نشد. دوباره تلاش کنید.
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            loading={isFetching}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            تلاش مجدد
          </Button>
        )}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-white p-10 text-center">
        <Package className="h-10 w-10 text-gray-300" strokeWidth={1} />
        <p className="text-sm font-medium text-gray-700">
          هنوز سفارشی ثبت نکرده‌اید
        </p>
        <p className="text-xs text-gray-500">
          بعد از اولین خرید، وضعیت سفارش‌هایتان اینجا دنبال می‌شود.
        </p>
        <Button asChild variant="dark" size="sm" className="mt-3">
          <Link href="/products">شروع خرید</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map(order => (
        <RecentOrderCard key={order.id} order={order} />
      ))}
    </ul>
  );
}

function RecentOrderCard({ order }: { order: OrderResponse }) {
  const [cancelOpen, setCancelOpen] = useState(false);

  const confirmFromWallet = useConfirmOrderFromWallet();
  const meta = getOrderStatusMeta(order.status);

  const payable = canPayOrderOnline(order);
  const cancellable = canCancelOrder(order);
  const walletRetry = needsWalletConfirmation(order);

  return (
    <li
      data-order-card={order.id}
      className="rounded-lg border border-border bg-white transition-shadow hover:shadow-sm">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* شناسه و وضعیت */}
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">شماره سفارش</span>
            <span
              dir="ltr"
              className="max-w-full break-all font-mono text-sm font-medium text-gray-900"
            >
              {order.orderNumber}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <span className="text-xs text-gray-500">
              {toPersianDate(order.createdAt)}
            </span>
          </div>

          {meta.nextAction && (
            <p className="text-xs text-gray-500">{meta.nextAction}</p>
          )}
        </div>

        {/* مبلغ و اقدام‌ها */}
        <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
          <p className="text-sm font-semibold text-gray-900">
            {formatPrice(order.finalPrice)}{' '}
            <span className="text-xs font-normal text-gray-500">تومان</span>
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {/* پرداخت: همان جریانِ موجودِ پرداخت سفارش */}
            {payable && <OrderPayment order={order} />}

            {walletRetry && (
              <Button
                size="sm"
                variant="dark"
                className="h-9 px-4 text-sm sm:h-8"
                onClick={() => confirmFromWallet.mutate(order.id)}
                loading={confirmFromWallet.isPending}
                disabled={confirmFromWallet.isPending}
              >
                تأیید با اعتبارها
              </Button>
            )}

            {cancellable && (
              <Button
                size="sm"
                variant="destructive"
                className="h-9 px-4 text-sm sm:h-8"
                onClick={() => setCancelOpen(true)}
              >
                لغو سفارش
              </Button>
            )}

            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-9 px-4 text-sm sm:h-8"
            >
              <Link href={`/dashboard/orders?order=${order.id}`}>
                جزئیات سفارش
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {cancellable && (
        <CancelOrderDialog
          order={order}
          open={cancelOpen}
          onOpenChange={setCancelOpen}
        />
      )}
    </li>
  );
}

/** برای سازگاری با استفاده‌های قدیمی‌تر همین کامپوننت */
export function RecentOrdersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={cn('space-y-3')}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-lg" />
      ))}
    </div>
  );
}
