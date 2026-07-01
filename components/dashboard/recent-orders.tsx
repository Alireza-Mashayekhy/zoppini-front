import { cn, formatPrice } from '@/lib/utils';
import { OrderStatus } from '@/services/features/orders/type';

import { Skeleton } from '../ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

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

export function RecentOrders({
  orders,
  isLoading,
}: {
  orders: any;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  return (
    <Table dir="rtl">
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">آیدی</TableHead>
          <TableHead>قیمت</TableHead>
          <TableHead className="text-left">وضعیت</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders?.map((ord: any) => {
          const status = statusMap[ord.status as OrderStatus];

          return (
            <TableRow key={ord.id}>
              <TableCell className="text-center">{ord.id}</TableCell>
              <TableCell>{formatPrice(ord.finalPrice)} تومان</TableCell>
              <TableCell align="left">
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    status.color,
                  )}
                >
                  {status.label}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
