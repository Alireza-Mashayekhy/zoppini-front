'use client';
import { Info, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const CONSENT_TITLE = 'برای تجربه بهتر خرید در زوپینی';

export const CONSENT_DESCRIPTION =
  'برای اینکه سایت زوپینی بهتر کار کنه و تجربه خرید راحت‌تری داشته باشید، از کوکی‌ها استفاده می‌کنیم. کوکی‌ها فایل‌های کوچیکی هستن که به سایت کمک می‌کنن امکاناتی مثل ورود به حساب کاربری و سبد خرید درست کار کنن. همچنین برای بهبود سایت و نمایش محتوای مرتبط‌تر، از کوکی‌های آماری و تبلیغاتی استفاده می‌کنیم که فعال شدن اون‌ها به انتخاب شما بستگی داره.';

export type ConsentChoice = 'all' | 'reject';

export interface ConsentBarProps {
  /** Choice currently being saved, used to disable both actions. */
  pending: ConsentChoice | null;
  /** Save failure; the bar stays open so the visitor can retry. */
  error: string;
  onAcceptAll: () => void;
  onAcceptNecessary: () => void;
  /** Hides the bar only — never a consent decision. */
  onClose: () => void;
}

/**
 * Compact consent notification pinned to the bottom of the viewport.
 *
 * Kept in the layout flow of its own fixed wrapper so it never shifts the page,
 * and exposes its height as `--zp-cookie-bar-height` so floating controls (the
 * compare bar) can sit above it instead of underneath.
 */
export default function ConsentBar({
  pending,
  error,
  onAcceptAll,
  onAcceptNecessary,
  onClose,
}: ConsentBarProps) {
  const [expanded, setExpanded] = useState(false);
  const bar = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const element = bar.current;
    if (!element) return;
    const apply = () =>
      root.style.setProperty(
        '--zp-cookie-bar-height',
        `${element.offsetHeight}px`,
      );
    apply();
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(apply);
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      root.style.removeProperty('--zp-cookie-bar-height');
    };
  }, [expanded]);

  return (
    <div
      dir="rtl"
      className="fixed inset-x-0 bottom-0 z-[60] pb-[env(safe-area-inset-bottom)]"
    >
      <section
        ref={bar}
        aria-label="رضایت کوکی‌ها"
        className="border-t border-black/10 bg-white/95 shadow-[0_-10px_30px_-22px_rgba(0,0,0,0.45)] backdrop-blur-md"
      >
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-3 pt-9 sm:px-6 sm:pb-4 sm:pt-4 sm:ps-12">
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن بنر کوکی‌ها بدون ثبت انتخاب"
            title="بستن"
            className="absolute right-2.5 top-1 inline-flex size-7 items-center justify-center text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-gray-900/30 focus-visible:outline-none sm:right-3"
          >
            <X className="size-4" aria-hidden="true" />
          </button>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold leading-6 text-gray-900 sm:text-base">
                {CONSENT_TITLE}
              </h2>
              <p
                className={cn(
                  'mt-1 text-right text-[11px] leading-5 text-gray-600 sm:text-[12.5px] sm:leading-6',
                  !expanded && 'line-clamp-3 sm:line-clamp-none',
                )}
              >
                {CONSENT_DESCRIPTION}
              </p>
              <button
                type="button"
                onClick={() => setExpanded(value => !value)}
                aria-expanded={expanded}
                className="mt-1 text-[11px] font-medium text-gray-500 underline underline-offset-4 transition-colors hover:text-black sm:hidden"
              >
                {expanded ? 'کمتر' : 'بیشتر'}
              </button>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:items-center">
              <Button
                variant="dark"
                disabled={pending !== null}
                onClick={onAcceptAll}
                className="h-9 px-4 text-xs font-semibold sm:h-10 sm:text-sm"
              >
                {pending === 'all' ? (
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : null}
                پذیرش همه
              </Button>
              <Button
                variant="darkOutline"
                disabled={pending !== null}
                onClick={onAcceptNecessary}
                className="h-9 border-black/25 px-4 text-xs sm:h-10 sm:text-sm"
              >
                {pending === 'reject' ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : null}
                فقط کوکی‌های ضروری
              </Button>
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-2 flex items-start gap-1.5 border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] leading-5 text-red-700"
            >
              <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
