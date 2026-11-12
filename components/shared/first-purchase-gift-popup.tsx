'use client';

import { Gift, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { withCallbackUrl } from '@/lib/callback-url';
import {
  useFirstPurchaseGiftConfig,
  useFirstPurchaseGiftEligibility,
} from '@/services/features/first-purchase-gift/hooks';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';

const STORAGE_KEY = 'zoppini-first-purchase-gift-popup-v1';

export default function FirstPurchaseGiftPopup() {
  const user = useAuthStore(state => state.user);
  const isCartOpen = useCartStore(state => state.isOpen);
  const { data: configResponse } = useFirstPurchaseGiftConfig();
  const { data: eligibilityResponse, isLoading: eligibilityLoading } =
    useFirstPurchaseGiftEligibility(Boolean(user));
  const [visible, setVisible] = useState(false);

  const config = configResponse?.data;
  const eligibility = eligibilityResponse?.data;

  useEffect(() => {
    if (!config?.active || !config.popupEnabled || isCartOpen) return;
    if (user && (eligibilityLoading || !eligibility?.eligible)) return;

    const now = Date.now();
    let shouldShow = config.popupFrequency === 'always';
    if (
      config.popupFrequency === 'session' &&
      window.sessionStorage.getItem(STORAGE_KEY) !== 'shown'
    ) {
      shouldShow = true;
    }
    const lastShown = Number(window.localStorage.getItem(STORAGE_KEY));
    if (
      config.popupFrequency === 'daily' &&
      (!Number.isFinite(lastShown) ||
        lastShown <= 0 ||
        now - lastShown >= 24 * 60 * 60 * 1000)
    ) {
      shouldShow = true;
    }
    if (!shouldShow) return;
    const timer = window.setTimeout(() => {
      if (config.popupFrequency === 'session') {
        window.sessionStorage.setItem(STORAGE_KEY, 'shown');
      } else if (config.popupFrequency === 'daily') {
        window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
      }
      setVisible(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [config, eligibility?.eligible, eligibilityLoading, isCartOpen, user]);

  if (
    !visible ||
    isCartOpen ||
    !config?.active ||
    !config.popupEnabled ||
    (user && !eligibility?.eligible)
  ) {
    return null;
  }

  const close = () => {
    if (config.popupFrequency === 'session') {
      window.sessionStorage.setItem(STORAGE_KEY, 'shown');
    } else if (config.popupFrequency === 'daily') {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
    setVisible(false);
  };

  const destination = user ? '/checkout' : withCallbackUrl('/login', '/checkout');

  return (
    <aside
      role="dialog"
      aria-label={config.title}
      aria-modal="false"
      dir="rtl"
      className="fixed right-4 top-28 z-[60] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-amber-200/70 bg-white shadow-[0_20px_60px_-18px_rgba(67,20,7,.42)]"
    >
      <div className="h-1 bg-gradient-to-l from-amber-300 via-rose-500 to-rose-950" />
      <div className="p-5">
        <button
          type="button"
          onClick={close}
          aria-label="بستن پیام هدیه"
          className="absolute left-3 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-700"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-900">
          <Gift className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold tracking-wide text-rose-800">
          خوش‌آمدید به زوپینی
        </p>
        <h2 className="mt-1 text-lg font-bold text-stone-900">{config.title}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          {config.description}
        </p>
        <div className="my-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-950">
          <span className="text-2xl font-bold tabular-nums">
            {config.discountPercent}٪
          </span>
          <span>تخفیف روی محصولات واجد شرایط، هنگام اولین خرید آنلاین</span>
        </div>
        {user ? (
          <Button asChild className="w-full">
            <Link href={destination} onClick={close}>مشاهده در سبد خرید</Link>
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button asChild>
              <Link href={withCallbackUrl('/login', '/checkout')} onClick={close}>ورود</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withCallbackUrl('/sign-up', '/checkout')} onClick={close}>ثبت‌نام</Link>
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
