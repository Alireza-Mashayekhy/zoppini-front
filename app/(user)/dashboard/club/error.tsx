'use client';

import { Award, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

/**
 * صفحه‌ی خطای مسیر باشگاه مشتریان.
 * اگر رندر صفحه (خارج از بخش‌های محافظت‌شده) خطا بدهد، کاربر به‌جای
 * صفحه‌ی سفید/خطای کلاینت، یک پیام قابل‌فهم و دکمه‌ی تلاش مجدد می‌بیند.
 */
export default function ClubError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      dir="rtl"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-lg border border-border bg-white p-8 text-center"
    >
      <Award className="h-12 w-12 text-gray-300" strokeWidth={1} />

      <h1 className="text-xl font-light tracking-wide">
        نمایش باشگاه مشتریان با خطا مواجه شد
      </h1>

      <p className="max-w-md text-sm text-gray-500">
        ارتباط با سرویس باشگاه مشتریان برقرار نشد یا داده‌های دریافتی نامعتبر
        بودند. لطفاً دوباره تلاش کنید؛ در صورت تکرار با پشتیبانی تماس بگیرید.
      </p>

      {error?.digest && (
        <p className="text-[11px] text-gray-400">کد خطا: {error.digest}</p>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={() => reset()}>
          <RefreshCcw className="h-4 w-4" />
          تلاش مجدد
        </Button>

        <Button variant="outline" asChild>
          <Link href="/dashboard">بازگشت به داشبورد</Link>
        </Button>
      </div>
    </div>
  );
}
