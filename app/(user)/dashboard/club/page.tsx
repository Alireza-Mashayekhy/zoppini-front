'use client';

import ClubCoupons from '@/components/dashboard/club/club-coupons';
import ClubHistory from '@/components/dashboard/club/club-history';
import ClubLevels from '@/components/dashboard/club/club-levels';
import ClubSummary from '@/components/dashboard/club/club-summary';
import ClubWallets from '@/components/dashboard/club/club-wallets';

export default function ClubPage() {
  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-light tracking-wide">باشگاه مشتریان</h1>
        <p className="mt-1 text-sm text-gray-500">
          امتیازها، اعتبار، کیف پول‌ها و بن‌های تخفیف شما در باشگاه مشتریان
        </p>
      </div>

      {/* خلاصه امتیاز و اعتبار */}
      <ClubSummary />

      {/* سطوح وفاداری */}
      <ClubLevels />

      {/* کیف پول‌های باشگاه */}
      <ClubWallets />

      {/* بن‌های تخفیف */}
      <div className="space-y-4">
        <h2 className="text-xl font-light tracking-wide">بن‌های تخفیف</h2>
        <ClubCoupons />
      </div>

      {/* تاریخچه وفاداری */}
      <div className="space-y-4">
        <h2 className="text-xl font-light tracking-wide">تاریخچه وفاداری</h2>
        <ClubHistory />
      </div>
    </div>
  );
}
