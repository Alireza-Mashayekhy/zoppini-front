'use client';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  cleanOptionalStorage,
  getConsent,
  setConsent,
  track,
} from '@/lib/consent/client';
import { privacyUrl } from '@/lib/consent/endpoints';
import { Consent, denied, Selection } from '@/lib/consent/policy';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
function PageTracking() {
  const path = usePathname();
  useEffect(() => {
    const run = () => {
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
export function CookieSettingsLink() {
  return (
    <button
      type="button"
      className="underline text-sm"
      onClick={() => window.dispatchEvent(new Event('privacy-open'))}
    >
      تنظیمات کوکی‌ها
    </button>
  );
}
export default function ConsentManager() {
  const [banner, showBanner] = useState(false);
  const [panel, showPanel] = useState(false);
  const [draft, setDraft] = useState<Selection>(denied);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const loaded = useRef(false);
  const revision = useRef(0);
  useEffect(() => {
    const open = () => {
      setDraft(getConsent() || denied);
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
        setDraft(d.consent || denied);
        showBanner(!d.consent);
        cleanOptionalStorage();
      })
      .catch(() => showBanner(true));
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
  async function save(value: Selection, choice: string) {
    revision.current++;
    setBusy(true);
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
        body: JSON.stringify({ ...value, choice }),
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
      setBusy(false);
    }
  }
  const all = { preferences: true, analytics: true, marketing: true };
  return (
    <>
      <Suspense fallback={null}>
        <PageTracking />
      </Suspense>
      <div className="fixed bottom-2 left-2 z-40 rounded border bg-white p-2 shadow">
        <CookieSettingsLink />
      </div>
      {banner && (
        <section
          aria-label="رضایت کوکی‌ها"
          dir="rtl"
          className="fixed bottom-0 inset-x-0 z-50 border-t bg-white p-5 shadow-xl"
        >
          <button
            type="button"
            aria-label="بستن موقت بنر بدون ثبت انتخاب"
            className="float-left p-2"
            onClick={() => showBanner(false)}
          >
            ×
          </button>
          <p className="max-w-5xl leading-8">
            زوپینی برای عملکرد درست فروشگاه از کوکی‌های ضروری استفاده می‌کند. با
            اجازه‌ی شما، کوکی‌های تحلیل به ما کمک می‌کنند نحوه‌ی استفاده از سایت
            را بفهمیم و آن را بهتر کنیم. کوکی‌های بازاریابی فقط با انتخاب شما
            فعال می‌شوند.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setDraft(getConsent() || denied);
                showPanel(true);
              }}
            >
              مدیریت ترجیحات
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void save(all, 'all')}
            >
              پذیرش همه
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void save(denied, 'reject')}
            >
              رد کوکی‌های غیرضروری
            </Button>
          </div>
          <p role="status">{error}</p>
        </section>
      )}
      <Dialog open={panel} onOpenChange={showPanel}>
        <DialogContent dir="rtl">
          <DialogTitle>مدیریت ترجیحات کوکی‌ها</DialogTitle>
          <DialogDescription>
            تحلیل فقط با شناسه تصادفی انجام می‌شود و به حساب مشتری متصل نمی‌شود.
            تغییر انتخاب در هر زمان ممکن است. با اجازه ترجیحات، ویجت پشتیبانی
            RamonAI از سرویس خارجی بارگذاری می‌شود. بازاریابی فعلاً فناوری فعال
            ندارد.
          </DialogDescription>
          <label className="flex gap-3 p-3">
            <input type="checkbox" checked disabled readOnly />
            ضروری — همیشه روشن، برای ورود و سبد درخواستی
          </label>
          {(['preferences', 'analytics', 'marketing'] as const).map(
            (key, i) => (
              <label key={key} className="flex gap-3 p-3">
                <input
                  type="checkbox"
                  checked={draft[key]}
                  onChange={e =>
                    setDraft({ ...draft, [key]: e.target.checked })
                  }
                />
                {
                  [
                    'ترجیحات — یادآوری تنظیمات رابط و ویجت پشتیبانی RamonAI',
                    'تحلیل — اندازه‌گیری استفاده و قیف خرید، نگهداری پیش‌فرض ۱۸۰ روز',
                    'بازاریابی — فعلاً فناوری فعال ندارد',
                  ][i]
                }
              </label>
            ),
          )}
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy} onClick={() => void save(draft, 'custom')}>
              ذخیره‌ی انتخاب من
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void save(all, 'all')}
            >
              پذیرش همه
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void save(denied, 'reject')}
            >
              رد کوکی‌های غیرضروری
            </Button>
          </div>
          <p role="status">{error}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
