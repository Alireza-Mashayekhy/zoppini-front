'use client';

import { History, RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatPrice, toPersianDateTime } from '@/lib/utils';
import { useClubLoyaltyHistories } from '@/services/features/club/hooks';
import { LoyaltyHistory, rialToToman } from '@/services/features/club/type';

const dateLabel = (history: LoyaltyHistory) => {
  if (history.Date) {
    const formatted = toPersianDateTime(history.Date);

    if (formatted) return formatted;
  }

  return history.PersianDate || '—';
};

/**
 * تاریخچه وفاداری کاربر:
 * امتیازها، اعتبارها و بن‌های دریافتی/مصرفی
 */
export default function ClubHistory() {
  const { data, isLoading, isError, refetch, isFetching } =
    useClubLoyaltyHistories();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-white p-10 text-center">
        <History className="h-10 w-10 text-gray-300" strokeWidth={1} />
        <p className="text-sm text-gray-500">تاریخچه وفاداری دریافت نشد</p>
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

  const histories = data?.data ?? [];

  if (histories.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white p-10 text-center">
        <History className="mx-auto h-10 w-10 text-gray-300" strokeWidth={1} />
        <p className="mt-3 text-sm text-gray-500">
          هنوز فعالیتی در باشگاه مشتریان نداشته‌اید
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <div className="overflow-x-auto">
        <Table dir="rtl">
          <TableHeader>
            <TableRow>
              <TableHead>تاریخ</TableHead>
              <TableHead>برنامه</TableHead>
              <TableHead>امتیاز</TableHead>
              <TableHead>اعتبار</TableHead>
              <TableHead>باقیمانده اعتبار</TableHead>
              <TableHead>شرح</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {histories.map((history: LoyaltyHistory) => (
              <TableRow key={history.Id}>
                <TableCell className="whitespace-nowrap text-xs text-gray-500">
                  {dateLabel(history)}
                </TableCell>

                <TableCell className="text-sm">
                  {history.ProgramType || '—'}
                </TableCell>

                <TableCell>
                  {history.Point != null && history.Point !== 0 ? (
                    <span
                      className={cn(
                        'text-sm font-medium',
                        history.Point > 0 ? 'text-green-600' : 'text-red-600',
                      )}
                    >
                      {history.Point > 0 ? '+' : ''}
                      {formatPrice(history.Point)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </TableCell>

                <TableCell>
                  {history.Credit != null && history.Credit !== 0 ? (
                    <span
                      className={cn(
                        'text-sm font-medium',
                        history.Credit > 0 ? 'text-green-600' : 'text-red-600',
                      )}
                    >
                      {history.Credit > 0 ? '+' : ''}
                      {formatPrice(rialToToman(history.Credit))} تومان
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </TableCell>

                <TableCell className="text-sm">
                  {history.CustomerRemainingCredit != null
                    ? `${formatPrice(rialToToman(history.CustomerRemainingCredit))} تومان`
                    : '—'}
                </TableCell>

                <TableCell className="max-w-56 truncate text-xs text-gray-500">
                  {history.Description ||
                    history.CouponName ||
                    history.PriceListName ||
                    '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
