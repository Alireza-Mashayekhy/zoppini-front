import { CreditCard } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * اطلاعرسانی خرید اقساطی، فقط زیر دکمهٔ «افزودن به سبد خرید» در صفحهٔ محصول.
 *
 * جایگزین نوار بنفش/صورتی اسنپ‌پی پایین کارت‌های محصول شد؛ اینجا با رنگ‌ها و
 * استایل خود زوپینی (بوردر نازک، زمینهٔ سفید، متن مشکی، آیکن تک رنگ) نمایش
 * داده می‌شود و هیچ لوگو، لینک یا رنگ برند اسنپ‌پی/دیجیپی ندارد.
 *
 * فقط اطلاعرسانی است و هیچ مبلغی را وعده نمی‌دهد: اسنپ‌پی اهلیت هر سبد را
 * به‌صورت داینامیک و بر اساس مبلغ نهایی (`/online/offer/v1/eligible`) تعیین
 * می‌کند، پس نوشتن «هر قسط X تومان» در صفحهٔ محصول گمراهکننده بود.
 */
export default function InstallmentInfo({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      dir="rtl"
      className={cn(
        'flex w-full items-center gap-3 border border-[#e8e6e3] bg-white px-4 py-3 text-right',
        className,
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center border border-[#e8e6e3] bg-[#f7f7f7] text-[#1a1a1a]">
        <CreditCard
          className="size-4"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </span>

      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-semibold leading-5 text-[#1a1a1a] sm:text-sm">
          خرید اقساطی ۴ مرحله‌ای اسنپ‌پی
        </span>
        <span className="text-[11px] leading-5 text-[#85817c] sm:text-xs">
          شرایط و مبلغ نهایی در مرحله پرداخت مشخص می‌شود
        </span>
      </span>
    </div>
  );
}
