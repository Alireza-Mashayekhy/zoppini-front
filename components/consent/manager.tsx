'use client';
import {
  BarChart3,
  Check,
  ChevronLeft,
  Cookie,
  Info,
  Loader2,
  Lock,
  Megaphone,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  cleanOptionalStorage,
  getConsent,
  setConsent,
  track,
} from '@/lib/consent/client';
import { privacyUrl } from '@/lib/consent/endpoints';
import { Consent, denied, Selection, toSelection } from '@/lib/consent/policy';
import { captureTorobClick } from '@/lib/consent/torob-client';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type Choice = 'all' | 'reject' | 'custom';

const all: Selection = {
  preferences: true,
  analytics: true,
  marketing: true,
};

const optionalCategories = [
  {
    key: 'preferences',
    title: 'ترجیحات',
    description: 'یادآوری تنظیمات رابط و بارگذاری ویجت پشتیبانی RamonAI.',
    Icon: SlidersHorizontal,
  },
  {
    key: 'analytics',
    title: 'تحلیل',
    description:
      'اندازهگیری استفاده و قیف خرید با شناسه تصادفی؛ نگهداری پیشفرض ۱۸۰ روز.',
    Icon: BarChart3,
  },
  {
    key: 'marketing',
    title: 'بازاریابی',
    description:
      'با رضایت شما شناسه کلیک ترب برای انتساب خرید تا هفت روز نگهداری و اطلاعات سفارش منتسب به ترب ارسال می‌شود.',
    Icon: Megaphone,
  },
] as const;

function PageTracking() {
  const path = usePathname();
  useEffect(() => {
    const run = () => {
      void captureTorobClick();
      void track('page_view').then(() =>
        window.dispatchEvent(new Event('analytics-page')),
      );
    };
    run();
    window.addEventListener('privacy-changed', run);
    return () => window.removeEventListener('privacy-changed', run);
  }, [path]);
  return null;
}

function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-xs leading-6 text-red-700"
    >
      <Info className="mt-1 size-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

/** Permanent link used in the public footer. */
export function CookieSettingsLink() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4 transition-colors hover:text-black"
      onClick={() => window.dispatchEvent(new Event('privacy-open'))}
    >
      <Cookie className="size-3.5" aria-hidden="true" />
      تنظیمات کوکیها
    </button>
  );
}

export default function ConsentManager() {
  const [banner, showBanner] = useState(false);
  const [panel, showPanel] = useState(false);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<Selection>(denied);
  const [pending, setPending] = useState<Choice | null>(null);
  const [error, setError] = useState('');
  const loaded = useRef(false);
  const revision = useRef(0);
  useEffect(() => {
    const open = () => {
      setDraft(toSelection(getConsent()));
      setError('');
      showPanel(true);
    };
    window.addEventListener('privacy-open', open);
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setConsent(null);
        location.reload();
      }
    };
    window.addEventListener('pageshow', restore);
    const channel =
      typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel('zoppini-privacy')
        : null;
    if (channel)
      channel.onmessage = () => {
        setConsent(null);
        (window as unknown as Record<string, unknown>)[
          'ga-disable-G-9X59F9BJFQ'
        ] = true;
        cleanOptionalStorage();
        location.reload();
      };
    const initialRevision = revision.current;
    void fetch(privacyUrl('state'), { cache: 'no-store' })
      .then(r => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(d => {
        if (revision.current !== initialRevision) return;
        setConsent(d.consent);
        setDraft(toSelection(d.consent));
        showBanner(!d.consent);
        cleanOptionalStorage();
      })
      .catch(() => showBanner(true))
      .finally(() => setReady(true));
    return () => {
      window.removeEventListener('privacy-open', open);
      window.removeEventListener('pageshow', restore);
      channel?.close();
    };
  }, []);
  useEffect(() => {
    const load = () => {
      const granted = getConsent()?.analytics;
      (window as unknown as Record<string, unknown>)[
        'ga-disable-G-9X59F9BJFQ'
      ] = !granted;
      if (
        !granted ||
        loaded.current ||
        process.env.NEXT_PUBLIC_ENABLE_GOOGLE_ANALYTICS !== 'true'
      )
        return;
      loaded.current = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function (...args: unknown[]) {
        window.dataLayer.push(args);
      };
      window.gtag('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
      window.gtag('js', new Date());
      window.gtag('config', 'G-9X59F9BJFQ', {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: location.origin + '/',
        page_referrer: document.referrer
          ? new URL(document.referrer).hostname
          : '',
      });
      const script = document.createElement('script');
      script.id = 'consented-google-tag';
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-9X59F9BJFQ';
      document.head.appendChild(script);
    };
    window.addEventListener('privacy-changed', load);
    return () => window.removeEventListener('privacy-changed', load);
  }, []);
  async function save(value: Selection, choice: Choice) {
    revision.current++;
    setPending(choice);
    setError('');
    const previous = getConsent();
    // Stop local event dispatch immediately, including while withdrawal is being saved.
    setConsent(null);
    (window as unknown as Record<string, unknown>)['ga-disable-G-9X59F9BJFQ'] =
      true;
    try {
      const r = await fetch(privacyUrl('consent'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...toSelection(value), choice }),
      });
      if (!r.ok) throw new Error();
      const data: { consent: Consent } = await r.json();
      setConsent(data.consent);
      cleanOptionalStorage();
      showBanner(false);
      showPanel(false);
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('zoppini-privacy');
        channel.postMessage('changed');
        channel.close();
      }
      // Unload already executed optional third-party code on withdrawal.
      if (
        previous &&
        ((previous.analytics && !value.analytics) ||
          (previous.preferences && !value.preferences) ||
          (previous.marketing && !value.marketing))
      )
        location.reload();
    } catch {
      setError('انتخاب ذخیره نشد. ردیابی متوقف است؛ دوباره تلاش کنید.');
      showBanner(true);
    } finally {
      setPending(null);
    }
  }
  function openSettings() {
    setDraft(toSelection(getConsent()));
    setError('');
    showPanel(true);
  }

  return (
    <>
      <Suspense fallback={null}>
        <PageTracking />
      </Suspense>

      {/* Compact control for pages without the public footer. */}
      {ready && !banner && !panel && (
        <button
          type="button"
          aria-label="تنظیمات کوکیها"
          onClick={() => window.dispatchEvent(new Event('privacy-open'))}
          className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 border border-black/10 bg-white/90 px-3 py-2 text-xs font-medium text-gray-600 shadow-sm backdrop-blur transition-colors hover:border-black/30 hover:text-black animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none"
        >
          <Cookie className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">تنظیمات کوکیها</span>
        </button>
      )}

      {banner && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)]">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/10 to-transparent" />
          <section
            aria-label="رضایت کوکیها"
            dir="rtl"
            className="pointer-events-auto relative mx-auto mb-3 w-[calc(100%-1.5rem)] max-w-6xl border border-black/10 bg-white/95 shadow-[0_18px_60px_-24px_rgba(0,0,0,0.45)] backdrop-blur-md animate-in fade-in-0 slide-in-from-bottom-4 duration-300 motion-reduce:animate-none sm:mb-5"
          >
            <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:gap-10 lg:p-8">
              <div className="flex flex-1 items-start gap-4">
                <div className="hidden size-11 shrink-0 items-center justify-center border border-black/10 bg-gray-50 text-gray-800 sm:flex">
                  <Cookie className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-semibold tracking-[0.22em] text-gray-400">
                      ZOPPINI
                    </span>
                    <span className="h-px w-6 bg-gray-200" />
                    <span className="text-[11px] font-medium text-gray-400">
                      حریم خصوصی
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold leading-8 text-gray-900 sm:text-xl">
                    ما از کوکیها استفاده میکنیم
                  </h2>
                  <p className="max-w-2xl text-[13px] leading-7 text-gray-600 sm:text-sm">
                    کوکیهای ضروری برای کارکرد فروشگاه، ورود و سبد درخواستی
                    لازماند. با اجازهی شما، کوکیهای تحلیل به بهتر شدن تجربهی
                    خرید کمک میکنند و کوکیهای بازاریابی فقط با انتخاب شما فعال
                    میشوند. هرزمان میتوانید انتخاب خود را تغییر دهید.
                  </p>
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-2 lg:w-60">
                <Button
                  variant="dark"
                  disabled={pending !== null}
                  onClick={() => void save(all, 'all')}
                  className="h-11 w-full justify-between px-4 text-sm font-semibold"
                >
                  <span>پذیرش همه</span>
                  {pending === 'all' ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Check aria-hidden="true" />
                  )}
                </Button>
                <Button
                  variant="darkOutline"
                  disabled={pending !== null}
                  onClick={() => void save(denied, 'reject')}
                  className="h-11 w-full justify-between border-black/30 px-4 text-sm"
                >
                  <span>فقط کوکیهای ضروری</span>
                  {pending === 'reject' ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <ShieldCheck aria-hidden="true" />
                  )}
                </Button>
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={openSettings}
                  className="inline-flex h-9 items-center justify-center gap-1.5 text-xs font-medium text-gray-500 underline-offset-4 transition-colors hover:text-black hover:underline disabled:opacity-50"
                >
                  <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                  تنظیمات کوکیها
                  <ChevronLeft className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {error && (
              <div className="border-t border-red-100 bg-red-50/60 px-5 py-3 sm:px-7">
                <ErrorNotice message={error} />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 bg-gray-50/70 px-5 py-2.5 text-[11px] text-gray-500 sm:px-7">
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
                انتخاب شما ۱۸۰ روز محفوظ میماند و به حساب کاربری وصل نیست.
              </p>
              <button
                type="button"
                aria-label="بستن موقت بنر بدون ثبت انتخاب"
                title="بستن موقت بنر بدون ثبت انتخاب"
                onClick={() => showBanner(false)}
                className="inline-flex items-center gap-1 transition-colors hover:text-black"
              >
                <X className="size-3.5" aria-hidden="true" />
                بستن موقت
              </button>
            </div>
          </section>
        </div>
      )}

      <Dialog open={panel} onOpenChange={showPanel}>
        <DialogContent
          dir="rtl"
          showCloseButton={false}
          className="gap-0 p-0 sm:max-w-lg"
        >
          <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center border border-black/10 bg-gray-50 text-gray-800">
                <Cookie className="size-4" aria-hidden="true" />
              </div>
              <DialogHeader className="gap-1.5 text-start">
                <span className="text-[10px] font-semibold tracking-[0.2em] text-gray-400">
                  ZOPPINI / PRIVACY
                </span>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  مدیریت ترجیحات کوکیها
                </DialogTitle>
                <DialogDescription className="max-w-sm text-[13px] leading-6 text-gray-500">
                  هر دسته را جداگانه انتخاب کنید. کوکیهای ضروری همیشه فعالاند و
                  تغییر انتخاب در هر زمان ممکن است.
                </DialogDescription>
              </DialogHeader>
            </div>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="بستن پنجره"
                className="-mt-1 -ms-1 shrink-0 text-gray-400 hover:text-black"
              >
                <X aria-hidden="true" />
              </Button>
            </DialogClose>
          </div>

          <div className="max-h-[min(58vh,26rem)] space-y-2.5 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4 border border-black/10 bg-gray-50/70 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-black/10 bg-white text-gray-700">
                  <Lock className="size-4" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    ضروری{' '}
                    <span className="text-xs font-normal text-gray-400">
                      — همیشه فعال
                    </span>
                  </p>
                  <p className="text-xs leading-6 text-gray-500">
                    برای ورود، امنیت و سبد درخواستی لازم است و قابل خاموش کردن
                    نیست.
                  </p>
                </div>
              </div>
              <span className="shrink-0 border border-black/10 bg-white px-2 py-1 text-[11px] font-medium text-gray-500">
                فعال
              </span>
            </div>

            {optionalCategories.map(({ key, title, description, Icon }) => (
              <div
                key={key}
                className="flex items-start justify-between gap-4 border border-black/10 p-4 transition-colors hover:border-black/25"
              >
                <label
                  htmlFor={`consent-${key}`}
                  className="flex cursor-pointer items-start gap-3"
                >
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-black/10 bg-gray-50 text-gray-700">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-gray-900">
                      {title}
                    </span>
                    <span className="block text-xs leading-6 text-gray-500">
                      {description}
                    </span>
                  </span>
                </label>
                <Switch
                  id={`consent-${key}`}
                  checked={draft[key]}
                  onCheckedChange={checked =>
                    setDraft({ ...draft, [key]: checked })
                  }
                  aria-label={title}
                  className="mt-1.5 shrink-0"
                />
              </div>
            ))}

            <p className="flex items-start gap-2 pt-1 text-[11px] leading-6 text-gray-400">
              <ShieldCheck
                className="mt-1 size-3.5 shrink-0"
                aria-hidden="true"
              />
              تحلیل فقط با شناسه تصادفی انجام میشود، به حساب مشتری متصل نیست و
              اطلاعات ورود یا آدرس کامل صفحات ارسال نمیشود.
            </p>
            <ErrorNotice message={error} />
          </div>

          <div className="border-t border-black/10 bg-gray-50/70 px-5 py-4 sm:px-6">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                variant="dark"
                disabled={pending !== null}
                onClick={() => void save(draft, 'custom')}
                className="h-10 w-full gap-2 px-3 text-xs font-semibold"
              >
                {pending === 'custom' ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Check aria-hidden="true" />
                )}
                ذخیرهی انتخاب من
              </Button>
              <Button
                variant="darkOutline"
                disabled={pending !== null}
                onClick={() => void save(all, 'all')}
                className="h-10 w-full border-black/30 px-3 text-xs"
              >
                پذیرش همه
              </Button>
              <Button
                variant="outline"
                disabled={pending !== null}
                onClick={() => void save(denied, 'reject')}
                className="h-10 w-full px-3 text-xs"
              >
                فقط ضروری
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
