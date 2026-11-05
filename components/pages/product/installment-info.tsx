'use client';

import {
  ChevronLeft,
  CreditCard,
  LockKeyhole,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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

const DURATION = 7000;
const SLIDES = [
  {
    provider: 'دیجی‌پی',
    theme: 'blue',
    title: 'پرداخت آسان و اقساطی',
    description: 'خریدتان را با اعتبار دیجی‌پی در چهار قسط پرداخت کنید.',
  },
  {
    provider: 'دیجی‌پی',
    theme: 'blue',
    title: 'چطور قسطی خرید کنم؟',
    description:
      'پس از افزودن کالا به سبد، در مرحله پرداخت دیجی‌پی را انتخاب و شرایط اعتبار را بررسی کنید.',
  },
  {
    provider: 'اسنپ‌پی',
    theme: 'green',
    title: 'خرید امروز، پرداخت قسطی',
    description: 'با اعتبار اسنپ‌پی خریدتان را در چهار قسط پرداخت کنید.',
  },
  {
    provider: 'اسنپ‌پی',
    theme: 'green',
    title: 'چطور قسطی خرید کنم؟',
    description:
      'پس از افزودن کالا به سبد، در مرحله پرداخت اسنپ‌پی را انتخاب و شرایط اعتبار را بررسی کنید.',
  },
] as const;

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
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const [holding, setHolding] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const pointer = useRef<{ time: number; x: number; id: number } | null>(null);
  const amount = formatInstallment(price);
  const current = SLIDES[slide];
  const green = current.theme === 'green';

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (
      !open ||
      holding ||
      hidden ||
      reducedMotion ||
      slide === SLIDES.length - 1
    )
      return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - previous;
      previous = now;
      progressRef.current = Math.min(
        1,
        progressRef.current + elapsed / DURATION,
      );
      if (progressRef.current >= 1) {
        window.clearInterval(timer);
        progressRef.current = 0;
        setProgress(0);
        setSlide(value => Math.min(value + 1, SLIDES.length - 1));
      } else {
        setProgress(progressRef.current);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [open, holding, hidden, reducedMotion, slide]);

  function go(direction: number) {
    const next = Math.max(0, Math.min(SLIDES.length - 1, slide + direction));
    if (next !== slide) {
      setSlide(next);
      progressRef.current = 0;
      setProgress(0);
    }
  }
  function changeOpen(next: boolean) {
    setOpen(next);
    setHolding(false);
    pointer.current = null;
    if (next) {
      setSlide(0);
      progressRef.current = 0;
      setProgress(0);
    }
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
              هر قسط{' '}
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
        className={cn(
          'flex h-[min(690px,calc(100dvh-2rem))] w-[min(390px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden rounded-[16px] border-0 p-0 text-white shadow-2xl ring-0 sm:max-w-none',
          green ? 'bg-[#00a968]' : 'bg-[#063af2]',
        )}
        onKeyDown={event => {
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            go(1);
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            go(-1);
          }
        }}
      >
        <DialogTitle className="sr-only">راهنمای خرید اقساطی</DialogTitle>
        <DialogDescription className="sr-only">
          برای صفحه بعد سمت راست و برای صفحه قبل سمت چپ را لمس کنید. با نگه
          داشتن، پخش متوقف می‌شود.
        </DialogDescription>
        <div className="relative z-20 px-4 pt-4">
          <div
            className="flex gap-1"
            dir="ltr"
            role="progressbar"
            aria-label={`صفحه ${slide + 1} از ${SLIDES.length}`}
            aria-valuemin={1}
            aria-valuemax={SLIDES.length}
            aria-valuenow={slide + 1}
          >
            {SLIDES.map((_, index) => (
              <span
                key={index}
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/35"
              >
                <span
                  className="block h-full rounded-full bg-white"
                  style={{
                    width: `${index < slide ? 100 : index > slide ? 0 : progress * 100}%`,
                  }}
                />
              </span>
            ))}
          </div>
          <div className="mt-3 flex justify-start">
            <DialogClose asChild>
              <button
                type="button"
                aria-label="بستن راهنمای خرید اقساطی"
                className="flex size-9 items-center justify-center rounded-full text-white hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
              >
                <X className="size-6" />
              </button>
            </DialogClose>
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 top-14 flex flex-col items-center overflow-hidden px-7 pb-5 pt-5 text-center"
          aria-live="polite"
        >
          <div
            className={cn(
              'flex size-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg',
              green ? 'bg-[#00965e]' : 'bg-[#0036e3]',
            )}
          >
            {green ? (
              <span className="text-xl font-black">S</span>
            ) : (
              <span className="text-[38px] font-bold leading-none">⌃</span>
            )}
          </div>
          <h2 className="mt-4 text-xl font-bold leading-8">
            {current.title}
            <br />
            <span className="text-2xl">با {current.provider}</span>
          </h2>
          <p className="mt-2 max-w-[270px] text-xs font-medium leading-6 text-white/90">
            {current.description}
          </p>
          <div className="relative mt-5 flex w-full flex-1 items-end justify-center overflow-hidden">
            <div className="absolute bottom-4 size-64 rounded-full bg-white/20 blur-3xl" />
            <div className="relative h-[min(330px,100%)] w-[170px] rounded-t-[29px] border-[5px] border-b-0 border-[#26292e] bg-[#f5f6f8] px-3 pt-5 text-right text-[#30373b] shadow-2xl">
              <div className="absolute left-1/2 top-0 h-3 w-16 -translate-x-1/2 rounded-b-xl bg-[#26292e]" />
              <div className="mt-2 flex items-center justify-between border-b border-gray-200 pb-3 text-[9px] font-bold">
                <span>پرداخت</span>
                <LockKeyhole className="size-3" />
              </div>
              <div className="mt-4 rounded-lg bg-white p-2.5 text-[9px] shadow-sm">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="size-3" />
                  <span>سفارش شما</span>
                </div>
                <div className="mt-3 h-1.5 w-3/4 rounded bg-gray-100" />
                <div className="mt-2 h-1.5 w-1/2 rounded bg-gray-100" />
              </div>
              <div className="mt-3 rounded-lg bg-white p-2.5 text-[9px] shadow-sm">
                <p className="font-bold">پرداخت اعتباری {current.provider}</p>
                <div className="mt-2 flex gap-1">
                  <span
                    className={cn(
                      'rounded border px-2 py-1',
                      green
                        ? 'border-[#00a968] text-[#008d58]'
                        : 'border-[#063af2] text-[#063af2]',
                    )}
                  >
                    ۴ قسط
                  </span>
                  <span className="rounded border border-gray-200 px-2 py-1 text-gray-400">
                    اعتباری
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-14 w-[min(260px,100%)] rounded-xl bg-white px-4 py-3 text-right text-[#252a31] shadow-xl">
              <p className="text-[11px] font-bold">سهم هر قسط از قیمت کالا</p>
              <p
                className={cn(
                  'mt-1 text-lg font-black',
                  green ? 'text-[#009b61]' : 'text-[#063af2]',
                )}
              >
                {amount} <span className="text-[10px] font-medium">تومان</span>
              </p>
              <p className="mt-1 text-[9px] leading-4 text-gray-500">
                برای یک محصول، بدون هزینه ارسال و تخفیف سبد
              </p>
            </div>
          </div>
          <p className="relative pt-2 text-[10px] leading-4 text-white/85">
            امکان استفاده و شرایط نهایی در مرحله پرداخت مشخص می‌شود.
          </p>
        </div>
        {/* A short tap navigates; holding pauses without navigating. */}
        <div className="absolute inset-x-0 bottom-0 top-16 z-10 flex" dir="ltr">
          {([-1, 1] as const).map(direction => (
            <button
              key={direction}
              type="button"
              aria-label={direction === 1 ? 'صفحه بعد' : 'صفحه قبل'}
              className="h-full w-1/2 touch-manipulation focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-white"
              onPointerDown={event => {
                if (event.button !== 0) return;
                pointer.current = {
                  time: performance.now(),
                  x: event.clientX,
                  id: event.pointerId,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
                setHolding(true);
              }}
              onPointerUp={event => {
                const start = pointer.current;
                pointer.current = null;
                setHolding(false);
                if (
                  start &&
                  start.id === event.pointerId &&
                  performance.now() - start.time < 350 &&
                  Math.abs(event.clientX - start.x) < 20
                )
                  go(direction);
              }}
              onPointerCancel={() => {
                pointer.current = null;
                setHolding(false);
              }}
              onLostPointerCapture={() => {
                pointer.current = null;
                setHolding(false);
              }}
              onClick={event => {
                if (event.detail === 0) go(direction);
              }}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
