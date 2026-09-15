'use client';

import { RefreshCcw, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, toPersianDate } from '@/lib/utils';
import { useWallet } from '@/services/features/wallet/hooks';

/**
 * کارت موجودی و آمار کیف پول
 */
export default function WalletBalanceCard() {
  const { data: wallet, isLoading, isError, refetch, isFetching } = useWallet();

  if (isLoading) {
    return <Skeleton className="h-full min-h-64 rounded-lg" />;
  }

  if (isError || !wallet?.data) {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-white p-6 text-center">
        <Wallet className="h-10 w-10 text-gray-300" strokeWidth={1} />
        <p className="text-sm text-gray-500">اطلاعات کیف پول دریافت نشد</p>
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

  const info = wallet.data;

  const stats = [
    { label: 'کل شارژ‌ها', value: info.totalCharged },
    { label: 'کل خریدها', value: info.totalSpent },
    { label: 'کل عودت‌ها', value: info.totalRefunded },
  ];

  return (
    <div className="flex h-full flex-col justify-between rounded-lg bg-gray-800 p-6 text-white">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Wallet className="h-4 w-4" strokeWidth={1.5} />
          موجودی کیف پول
        </div>

        <p className="mt-3 text-3xl font-light tracking-wide">
          {formatPrice(info.balance)}{' '}
          <span className="text-sm text-gray-300">تومان</span>
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
        {stats.map(stat => (
          <div key={stat.label}>
            <p className="text-xs text-gray-400">{stat.label}</p>
            <p className="mt-1 text-sm font-medium">
              {formatPrice(stat.value)}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        کیف پول شما از {toPersianDate(info.createdAt)} فعال شده است
      </p>
    </div>
  );
}
