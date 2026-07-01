'use client';

import { RecentOrders } from '@/components/dashboard/recent-orders';
import { StatsCard } from '@/components/dashboard/stats-card';
import { useOrders } from '@/services/features/orders/hooks';

export default function DashboardPage() {
  const { data: orders, isLoading } = useOrders();

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

      {/* سفارشات اخیر */}
      <div className="bg-white border border-border p-6">
        <h2 className="text-lg font-light tracking-wide mb-4">سفارشات اخیر</h2>
        <RecentOrders orders={orders?.data} isLoading={isLoading} />
      </div>
    </div>
  );
}
