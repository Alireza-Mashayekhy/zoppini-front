'use client';

import { getOrderStatusMeta } from '@/lib/order-status';
import { cn } from '@/lib/utils';

/**
 * نشانِ وضعیت سفارش.
 *
 * برچسب و رنگ از یک منبعِ واحد (`lib/order-status.ts`) می‌آید تا داشبورد،
 * فهرست سفارش‌ها و جزئیات سفارش هیچ‌وقت با هم نخوانند. مقدارِ ناشناس هم
 * برچسبِ «نامشخص» می‌گیرد و باعث خطا نمی‌شود.
 */
export default function OrderStatusBadge({
  status,
  className,
}: {
  status: unknown;
  className?: string;
}) {
  const meta = getOrderStatusMeta(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        meta.badgeClassName,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('h-1.5 w-1.5 rounded-full', meta.dotClassName)}
      />
      {meta.label}
    </span>
  );
}
