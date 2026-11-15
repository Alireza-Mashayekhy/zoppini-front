'use client';

import {
  Award,
  Ban,
  ChevronLeft,
  Clock3,
  PackageCheck,
  RefreshCcw,
  ShoppingBag,
  Truck,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { type ComponentType } from 'react';

import { RecentOrders } from '@/components/dashboard/recent-orders';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  type DashboardOrderSummary,
  resolveOrderSummary,
} from '@/lib/order-status';
import { cn, formatPrice } from '@/lib/utils';
import { useClubMe } from '@/services/features/club/hooks';
import { rialToToman } from '@/services/features/club/type';
import { useOrders } from '@/services/features/orders/hooks';
import { useWallet } from '@/services/features/wallet/hooks';
import { useAuthStore } from '@/store/auth.store';

/** تعداد سفارش‌هایی که در بخش «سفارش‌های اخیر» نمایش داده می‌شود */
const RECENT_ORDERS_LIMIT = 4;

/**
 * داشبورد مشتری.
 *
 * ترتیبِ بخش‌ها عمداً این است: سلام و خلاصه‌ی سفارش‌ها (اصلِ ماجرا)،
 * سفارش‌های اخیر با اقدامِ بعدی، و در انتها کیف پول و باشگاه مشتریان که
 * نقشِ مکمل دارند.
 *
 * شمارش‌ها از `resolveOrderSummary` می‌آیند: آمارِ سرور مبناست و هرگز
 * لغوشده/در انتظار پرداخت به‌عنوان «تحویل شده» نمایش داده نمی‌شود.
 */
export default function DashboardPage() {
  const { user } = useAuthStore();

  const {
    data: orders,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useOrders();
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: club, isLoading: clubLoading } = useClubMe();

  const summary = resolveOrderSummary(orders ?? null);
  const recentOrders = (orders?.data ?? []).slice(0, RECENT_ORDERS_LIMIT);

  const greetingName = user?.fullName?.trim();

  return (
    <div dir="rtl" className="space-y-8 pb-10">
      {/* ───────────────────────────── سربرگ ───────────────────────────── */}
      <header className="space-y-1.5">
        <p className="text-[11px] tracking-[0.2em] text-[#8A8580]">
          پنل مشتریان زوپینی
        </p>
        <h1 className="text-2xl font-light tracking-wide text-[#1A1A1A] sm:text-3xl">
          {greetingName ? `سلام، ${greetingName}` : 'سلام'}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[#8A8580]">
          وضعیت سفارش‌هایتان را اینجا پیگیری کنید و با یک نگاه ببینید قدم
          بعدی چیست.
        </p>
      </header>

      {/* ─────────────────────── خلاصه‌ی سفارش‌ها ─────────────────────── */}
      <section aria-labelledby="orders-summary-title" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="orders-summary-title"
            className="text-base font-medium text-[#1A1A1A]"
          >
            خلاصه سفارش‌ها
          </h2>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1 rounded-sm text-xs text-[#8A8580] transition-colors hover:text-[#1A1A1A] focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:outline-none"
          >
            همه سفارش‌ها
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {isError ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-white p-8 text-center">
            <ShoppingBag className="h-10 w-10 text-gray-300" strokeWidth={1} />
            <p className="text-sm text-gray-500">
              خلاصه سفارش‌ها دریافت نشد. دوباره تلاش کنید.
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
        ) : (
          <SummaryCards summary={summary} isLoading={isLoading} />
        )}
      </section>

      {/* ───────────────────────── سفارش‌های اخیر ──────────────────────── */}
      <section aria-labelledby="recent-orders-title" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="recent-orders-title"
            className="text-base font-medium text-[#1A1A1A]"
          >
            سفارش‌های اخیر
          </h2>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1 rounded-sm text-xs text-[#8A8580] transition-colors hover:text-[#1A1A1A] focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:outline-none"
          >
            پیگیری سفارش‌ها
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <RecentOrders
          orders={recentOrders}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          isFetching={isFetching}
        />
      </section>

      {/* ─────────── کیف پول و باشگاه مشتریان (نقشِ مکمل) ─────────── */}
      <section aria-labelledby="wallet-club-title" className="space-y-3">
        <h2
          id="wallet-club-title"
          className="text-base font-medium text-[#1A1A1A]"
        >
          اعتبار و امتیاز شما
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {walletLoading ? (
            <Skeleton className="h-28 w-full rounded-lg" />
          ) : (
            wallet?.data && (
              <Link
                href="/dashboard/wallet"
                className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-white p-5 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:outline-none"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                    <Wallet
                      className="h-5 w-5 text-neutral-700"
                      strokeWidth={1.5}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-[#8A8580]">موجودی کیف پول</p>
                    <p className="mt-1 truncate text-xl font-light text-[#1A1A1A]">
                      {formatPrice(wallet.data.balance)}{' '}
                      <span className="text-xs text-[#8A8580]">تومان</span>
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-[#8A8580] transition-colors group-hover:text-[#1A1A1A]">
                  مدیریت کیف پول
                  <ChevronLeft
                    className="inline h-3.5 w-3.5 align-middle"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            )
          )}

          {clubLoading ? (
            <Skeleton className="h-28 w-full rounded-lg" />
          ) : (
            club?.data && (
              <Link
                href="/dashboard/club"
                className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-white p-5 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:outline-none"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                    <Award
                      className="h-5 w-5 text-neutral-700"
                      strokeWidth={1.5}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-[#8A8580]">
                      امتیاز باشگاه مشتریان
                    </p>
                    <p className="mt-1 truncate text-xl font-light text-[#1A1A1A]">
                      {formatPrice(club.data.TotalPoint ?? 0)}{' '}
                      <span className="text-xs text-[#8A8580]">امتیاز</span>
                      <span className="text-xs text-[#8A8580]">
                        {' '}
                        · اعتبار:{' '}
                        {formatPrice(rialToToman(club.data.AvailableCredit))}{' '}
                        تومان
                      </span>
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-[#8A8580] transition-colors group-hover:text-[#1A1A1A]">
                  مشاهده باشگاه
                  <ChevronLeft
                    className="inline h-3.5 w-3.5 align-middle"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            )
          )}
        </div>
      </section>
    </div>
  );
}

/* ==================================================================== */
/* کارت‌های خلاصه                                                      */
/* ==================================================================== */

interface SummaryCardConfig {
  key: keyof DashboardOrderSummary;
  label: string;
  hint: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: 'neutral' | 'warning' | 'success' | 'danger' | 'processing';
}

/**
 * کارت‌های خلاصه.
 *
 * برچسبِ هر کارت دقیقاً همان شمارشی را نشان می‌دهد که نامش می‌گوید
 * (قبلاً عددِ «لغو شده» زیر برچسب «تحویل شده» می‌آمد). کارت‌ها لینک به
 * فهرست سفارش‌ها هستند تا با کیبورد هم قابل استفاده باشند.
 */
const SUMMARY_CARDS: SummaryCardConfig[] = [
  {
    key: 'total',
    label: 'کل سفارش‌ها',
    hint: 'همه سفارش‌های ثبت‌شده',
    icon: ShoppingBag,
    tone: 'neutral',
  },
  {
    key: 'awaitingPayment',
    label: 'در انتظار پرداخت',
    hint: 'برای نهایی شدن باید پرداخت شوند',
    icon: Clock3,
    tone: 'warning',
  },
  {
    key: 'delivered',
    label: 'تحویل شده',
    hint: 'سفارش‌هایی که به دست شما رسیده',
    icon: PackageCheck,
    tone: 'success',
  },
  {
    key: 'cancelled',
    label: 'لغو شده',
    hint: 'سفارش‌های لغوشده',
    icon: Ban,
    tone: 'danger',
  },
];

const TONE_STYLES: Record<SummaryCardConfig['tone'], string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  warning: 'bg-amber-50 text-amber-700',
  success: 'bg-emerald-50 text-emerald-700',
  danger: 'bg-rose-50 text-rose-700',
  processing: 'bg-violet-50 text-violet-700',
};

function SummaryCards({
  summary,
  isLoading,
}: {
  summary: DashboardOrderSummary | null;
  isLoading: boolean;
}) {
  if (isLoading || !summary) {
    return (
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-busy="true"
      >
        {SUMMARY_CARDS.map(card => (
          <Skeleton key={card.key} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_CARDS.map(card => {
          const value = summary[card.key] ?? 0;

          return (
            <Link
              key={card.key}
              href="/dashboard/orders"
              data-summary-card={card.key}
              className="group rounded-lg border border-border bg-white p-5 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:outline-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-[#8A8580]">{card.label}</p>
                  <p className="mt-2 text-3xl font-light text-[#1A1A1A]">
                    {formatPrice(value)}
                  </p>
                </div>
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    TONE_STYLES[card.tone],
                  )}
                >
                  <card.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
                </span>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-[#8A8580]">
                {card.hint}
              </p>
            </Link>
          );
        })}
      </div>

      {summary.inTransit > 0 && (
        <p className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-3 text-xs text-[#8A8580]">
          <Truck className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          <span>
            {formatPrice(summary.inTransit)} سفارش در حال آماده‌سازی یا ارسال
            است.{' '}
            <Link
              href="/dashboard/orders"
              className="text-[#1A1A1A] underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:outline-none"
            >
              مشاهده در فهرست سفارش‌ها
            </Link>
          </span>
        </p>
      )}
    </div>
  );
}
