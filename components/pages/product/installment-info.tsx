'use client';

import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ShoppingBag,
  WalletCards,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { formatInstallment } from './installment-price';

const SLIDE_DURATION = 7000;
const SLIDE_COUNT = 3;

/** Product-only estimate; checkout and the payment provider determine the actual terms. */
export default function InstallmentInfo({
  className,
  price,
}: {
  className?: string;
  price: number;
}) {
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const amount = formatInstallment(price);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!open || reducedMotion || slide === SLIDE_COUNT - 1) return;
    const timer = window.setTimeout(
      () => setSlide(current => current + 1),
      SLIDE_DURATION,
    );
    return () => window.clearTimeout(timer);
  }, [open, reducedMotion, slide]);

  function changeOpen(next: boolean) {
    setOpen(next);
    if (next) setSlide(0);
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          dir="rtl"
          className={cn(
            'group flex w-full items-center gap-3 border border-[#e8e6e3] bg-white px-4 py-3 text-right transition-colors hover:border-[#b9afa1] hover:bg-[#faf9f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c2925]',
            className,
          )}
        >
          <span className="flex size-10 shrink-0 items-center justify-center border border-[#e8e6e3] bg-[#f7f7f7] text-[#1a1a1a]">
            <CreditCard
              className="size-4"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs font-semibold leading-5 text-[#1a1a1a] sm:text-sm">
              خرید اقساطی در ۴ قسط
            </span>
            <span className="text-[11px] leading-5 text-[#77716a] sm:text-xs">
              هر قسط تقریباً{' '}
              <strong className="font-bold text-[#27231f]">
                {amount} تومان
              </strong>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-[#77716a] group-hover:text-black sm:text-xs">
            جزئیات <ChevronLeft className="size-4" aria-hidden="true" />
          </span>
        </button>
      </DialogTrigger>

      <DialogContent
        dir="rtl"
        showCloseButton={false}
        className="flex h-[min(690px,calc(100dvh-2rem))] w-[min(390px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden rounded-[24px] border-0 bg-[#f4f1eb] p-0 text-[#211e1a] shadow-2xl ring-0 sm:max-w-none"
        onKeyDown={event => {
          if (event.key === 'ArrowLeft')
            setSlide(current => Math.min(current + 1, SLIDE_COUNT - 1));
          if (event.key === 'ArrowRight')
            setSlide(current => Math.max(current - 1, 0));
        }}
      >
        <DialogTitle className="sr-only">راهنمای خرید اقساطی</DialogTitle>
        <DialogDescription className="sr-only">
          راهنمای خرید اقساطی با اسنپ‌پی و دیجی‌پی و مبلغ تقریبی اقساط این محصول
        </DialogDescription>

        <div className="relative z-10 px-5 pt-5">
          <div
            className="flex gap-1.5"
            dir="ltr"
            aria-label={`اسلاید ${slide + 1} از ${SLIDE_COUNT}`}
          >
            {Array.from({ length: SLIDE_COUNT }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`رفتن به اسلاید ${index + 1}`}
                aria-current={index === slide ? 'step' : undefined}
                onClick={() => setSlide(index)}
                className="relative h-3 flex-1 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#766854]"
              >
                <span className="block h-1 overflow-hidden rounded-full bg-[#d7d0c5]">
                  <span
                    key={`${slide}-${index}`}
                    className={cn(
                      'block h-full origin-left rounded-full bg-[#28231e]',
                      index < slide
                        ? 'w-full'
                        : index > slide
                          ? 'w-0'
                          : 'w-full',
                    )}
                    style={
                      index === slide &&
                      slide < SLIDE_COUNT - 1 &&
                      !reducedMotion
                        ? {
                            animation: `installment-progress ${SLIDE_DURATION}ms linear forwards`,
                          }
                        : undefined
                    }
                  />
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-[#24201b] text-xs font-bold text-white">
                ز
              </span>
              <div>
                <p className="text-xs font-bold">زوپینی</p>
                <p className="mt-0.5 text-[10px] text-[#857d72]">
                  راهنمای خرید اقساطی
                </p>
              </div>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                aria-label="بستن راهنمای خرید اقساطی"
                className="flex size-9 items-center justify-center rounded-full bg-white/70 text-[#403a33] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-[#766854]"
              >
                <X className="size-4" />
              </button>
            </DialogClose>
          </div>
        </div>

        <div
          className="relative flex flex-1 flex-col justify-center overflow-y-auto px-7 py-5 sm:px-8"
          aria-live="polite"
        >
          {slide === 0 && (
            <div>
              <div className="mb-7 flex size-20 items-center justify-center rounded-[26px] bg-[#e5ded2] text-[#554a3e]">
                <CreditCard className="size-9" strokeWidth={1.3} />
              </div>
              <p className="mb-3 text-xs font-bold tracking-wide text-[#97846a]">
                خرید راحت‌تر از زوپینی
              </p>
              <h2 className="text-[27px] font-bold leading-[1.6] sm:text-[30px]">
                این محصول را
                <br />۴ قسطه بخرید.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#746c62]">
                بدون نیاز به پرداخت یک‌جای مبلغ محصول، شرایط پرداخت اقساطی را در
                مرحله پرداخت بررسی کنید.
              </p>
              <div className="mt-7 rounded-2xl border border-[#e4ddd3] bg-white/75 p-5">
                <p className="text-xs text-[#82786d]">
                  مبلغ تقریبی هر قسط این محصول
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {amount}{' '}
                  <span className="text-xs font-normal text-[#82786d]">
                    تومان
                  </span>
                </p>
                <p className="mt-2 text-[10px] leading-5 text-[#968d82]">
                  بر اساس قیمت یک عدد محصول، بدون هزینه ارسال و تخفیف سبد خرید
                </p>
              </div>
            </div>
          )}
          {slide === 1 && (
            <div>
              <div className="mb-7 flex size-20 items-center justify-center rounded-[26px] bg-[#e5ded2] text-[#554a3e]">
                <ShoppingBag className="size-9" strokeWidth={1.3} />
              </div>
              <p className="mb-3 text-xs font-bold text-[#97846a]">
                فقط چند قدم ساده
              </p>
              <h2 className="text-[27px] font-bold leading-[1.6]">
                چطور قسطی
                <br />
                خرید کنم؟
              </h2>
              <ol className="mt-7 space-y-5">
                {[
                  [
                    '۱',
                    'محصول را به سبد اضافه کنید',
                    'مدل دلخواهتان را انتخاب و خریدتان را شروع کنید.',
                  ],
                  [
                    '۲',
                    'به مرحله پرداخت بروید',
                    'در صورت ارائه، روش پرداخت اعتباری دلخواهتان را انتخاب کنید.',
                  ],
                  [
                    '۳',
                    'شرایط را بررسی و پرداخت کنید',
                    'مبلغ و زمان‌بندی نهایی را در سرویس پرداخت ببینید.',
                  ],
                ].map(([number, title, description]) => (
                  <li key={number} className="flex gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#d9cfc1] text-xs font-bold text-[#8d7961]">
                      {number}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{title}</p>
                      <p className="mt-1 text-xs leading-6 text-[#81786d]">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {slide === 2 && (
            <div>
              <div className="mb-7 flex size-20 items-center justify-center rounded-[26px] bg-[#e5ded2] text-[#554a3e]">
                <WalletCards className="size-9" strokeWidth={1.3} />
              </div>
              <p className="mb-3 text-xs font-bold text-[#97846a]">
                پرداخت با سرویس‌های اعتباری
              </p>
              <h2 className="text-[27px] font-bold leading-[1.6]">
                انتخاب با شماست.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#746c62]">
                در مرحله پرداخت می‌توانید گزینه‌های موجود از جمله اسنپ‌پی و
                دیجی‌پی را بررسی کنید.
              </p>
              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#e5ddd3] bg-white/75 px-4 py-5 text-center">
                  <span className="text-base font-bold">اسنپ‌پی</span>
                </div>
                <div className="rounded-2xl border border-[#e5ddd3] bg-white/75 px-4 py-5 text-center">
                  <span className="text-base font-bold">دیجی‌پی</span>
                </div>
              </div>
              <p className="mt-5 text-xs leading-6 text-[#81786d]">
                مبلغ اقساط تقریبی است. امکان استفاده، مبلغ نهایی و شرایط هر
                سرویس در مرحله پرداخت مشخص می‌شود.
              </p>
            </div>
          )}
        </div>

        <div className="relative z-10 border-t border-[#e5ddd3] px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSlide(current => Math.max(current - 1, 0))}
              disabled={slide === 0}
              className="flex items-center gap-1 rounded-full px-3 py-2 text-xs text-[#756a5d] disabled:invisible focus-visible:outline-2 focus-visible:outline-[#766854]"
            >
              <ChevronRight className="size-4" /> قبلی
            </button>
            <span className="text-[11px] text-[#988d80]">
              {(slide + 1).toLocaleString('fa-IR')} / ۳
            </span>
            {slide < SLIDE_COUNT - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setSlide(current => Math.min(current + 1, SLIDE_COUNT - 1))
                }
                className="flex items-center gap-1 rounded-full bg-[#28231e] px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#51483d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#766854]"
              >
                بعدی <ChevronLeft className="size-4" />
              </button>
            ) : (
              <DialogClose asChild>
                <button
                  type="button"
                  className="rounded-full bg-[#28231e] px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#51483d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#766854]"
                >
                  متوجه شدم
                </button>
              </DialogClose>
            )}
          </div>
        </div>
        <style>{`@keyframes installment-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
      </DialogContent>
    </Dialog>
  );
}
