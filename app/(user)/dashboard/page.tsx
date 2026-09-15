'use client';

import { RecentOrders } from '@/components/dashboard/recent-orders';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { useOrders } from '@/services/features/orders/hooks';
import { Wallet } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/services/features/wallet/hooks';

export default function DashboardPage() {
  const { data: orders, isLoading } = useOrders();
  const { data: wallet, isLoading: walletLoading } = useWallet();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-light tracking-wide text-[#1A1A1A]">
          خوش آمدید، رضا
        </h1>
        <p className="text-[#8A8580] text-sm mt-1">
          خلاصه‌ای از فعالیت‌های شما در پنل
        </p>
      </div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard label="کل سفارشات" value={orders?.stats?.total ?? 0} />
        <StatsCard
          label="سفارشات فعال"
          value={orders?.stats?.inProgress ?? 0}
        />
        <StatsCard label="ارسال شده" value={orders?.stats?.delivered ?? 0} />
        <StatsCard label="تحویل شده" value={orders?.stats?.cancelled ?? 0} />
      </div>

      {/* موجودی کیف پول */}
      {walletLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        wallet?.data && (
          <Link
            href="/dashboard/wallet"
            className="group flex items-center justify-between bg-white border border-border p-6 transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Wallet className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-[#8A8580] tracking-wider">
                  موجودی کیف پول
                </p>
                <p className="text-2xl font-light text-[#1A1A1A] mt-1">
                  {formatPrice(wallet.data.balance)}{' '}
                  <span className="text-sm">تومان</span>
                </p>
              </div>
            </div>
            <span className="text-sm text-[#8A8580] transition-colors group-hover:text-[#1A1A1A]">
              مدیریت کیف پول ←
            </span>
          </Link>
        )
      )}

      {/* سفارشات اخیر */}
      <div className="bg-white border border-border p-6">
        <h2 className="text-lg font-light tracking-wide mb-4">سفارشات اخیر</h2>
        <RecentOrders orders={orders?.data} isLoading={isLoading} />
      </div>
    </div>
  );
}
