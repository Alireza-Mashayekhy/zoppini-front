import { BadgeCheck, CreditCard, ShieldCheck, Truck } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * نوار «با خیال راحت خرید کنید» در صفحهٔ محصول، بعد از بخش گالری/توضیحات و
 * قبل از محصولات پیشنهادی و مرتبط.
 *
 * الهام‌گرفته از طرح مرجع، ولی تماماً با استایل و رنگ‌های خود زوپینی: بوردر
 * نازک #e8e6e3، زمینهٔ سفید، متن مشکی/خاکستری، آیکن‌های تکرنگ و
 * کادر تخت (بدون پس‌زمینهٔ صورتی، بدون لوگوی خارجی و بدون لینک).
 */
const TRUST_FEATURES = [
  { label: 'ارسال سریع', Icon: Truck },
  { label: 'ضمانت اصالت کالا', Icon: ShieldCheck },
  { label: 'درگاه پرداخت امن', Icon: CreditCard },
  { label: 'نماد اعتماد الکترونیک', Icon: BadgeCheck },
] as const;

export default function TrustStrip({ className }: { className?: string }) {
  return (
    <section
      dir="rtl"
      aria-label="مزایای خرید از زوپینی"
      className={cn(
        'mx-4 border border-[#e8e6e3] bg-white px-4 py-6 sm:px-6 md:mx-6 lg:px-8',
        className,
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="flex shrink-0 flex-col gap-1 text-right lg:w-64">
          <h2 className="text-lg font-bold text-[#1a1a1a] sm:text-xl">
            با خیال راحت خرید کنید
          </h2>
          <p className="text-xs leading-6 text-[#85817c] sm:text-sm">
            زوپینی ، اصالت و کیفیت را تضمین می‌کند.
          </p>
        </div>

        <ul className="grid flex-1 grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-4">
          {TRUST_FEATURES.map(({ label, Icon }) => (
            <li
              key={label}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span className="flex size-12 items-center justify-center rounded-full border border-[#e8e6e3] bg-[#f9f9f9] text-[#1a1a1a]">
                <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="text-[11px] font-medium leading-5 text-[#1a1a1a] sm:text-xs">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
