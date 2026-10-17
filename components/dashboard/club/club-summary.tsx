'use client';

import { Award, RefreshCcw, Ticket, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, toPersianDate } from '@/lib/utils';
import { useClubMe } from '@/services/features/club/hooks';
import { rialToToman } from '@/services/features/club/type';

/**
 * کارت خلاصه اطلاعات باشگاه مشتریان:
 * امتیاز، اعتبار (کیف پول باشگاه)، بن‌های فعال و تاریخ عضویت
 */
export default function ClubSummary() {
  const { data, isLoading, isError, refetch, isFetching } = useClubMe();

  if (isLoading) {
    return <Skeleton className="h-full min-h-64 rounded-lg" />;
  }

  if (isError || !data?.data) {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-white p-6 text-center">
        <Award className="h-10 w-10 text-gray-300" strokeWidth={1} />
        <p className="text-sm text-gray-500">
          اطلاعات باشگاه مشتریان دریافت نشد
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

  const customer = data.data;

  const activeCoupons = (customer.Coupons ?? []).filter(
    coupon => coupon.IsActive && !coupon.IsUsed,
  ).length;

  const stats = [
    {
      label: 'اعتبار قابل استفاده',
      value: `${formatPrice(rialToToman(customer.AvailableCredit))} تومان`,
      icon: Wallet,
    },
    {
      label: 'بن‌های فعال',
      value: formatPrice(activeCoupons),
      icon: Ticket,
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between rounded-lg bg-gray-800 p-6 text-white">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Award className="h-4 w-4" strokeWidth={1.5} />
          امتیاز شما در باشگاه مشتریان
        </div>

        <p className="mt-3 text-4xl font-light tracking-wide">
          {formatPrice(customer.TotalPoint ?? 0)}{' '}
          <span className="text-sm text-gray-300">امتیاز</span>
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
        {stats.map(stat => (
          <div key={stat.label} className="flex items-start gap-2">
            <stat.icon
              className="mt-0.5 h-4 w-4 text-gray-400"
              strokeWidth={1.5}
            />
            <div>
              <p className="text-xs text-gray-400">{stat.label}</p>
              <p className="mt-1 text-sm font-medium">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {customer.RegisterDate && (
        <p className="mt-4 text-xs text-gray-400">
          عضو باشگاه از {toPersianDate(customer.RegisterDate)}
        </p>
      )}
    </div>
  );
}
