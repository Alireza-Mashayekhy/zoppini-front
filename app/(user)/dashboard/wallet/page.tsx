'use client';

import WalletBalanceCard from '@/components/dashboard/wallet/wallet-balance-card';
import WalletChargeForm from '@/components/dashboard/wallet/wallet-charge-form';
import WalletTransactions from '@/components/dashboard/wallet/wallet-transactions';

export default function WalletPage() {
  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-light tracking-wide">کیف پول</h1>
        <p className="mt-1 text-sm text-gray-500">
          موجودی، شارژ و تاریخچه تراکنش‌های کیف پول شما
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* موجودی */}
        <div className="lg:col-span-2">
          <WalletBalanceCard />
        </div>

        {/* شارژ */}
        <div className="lg:col-span-3">
          <WalletChargeForm />
        </div>
      </div>

      {/* تراکنش‌ها */}
      <WalletTransactions />
    </div>
  );
}
