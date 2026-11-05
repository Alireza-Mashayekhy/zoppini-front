'use client';
import { usePathname } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import ConsentBar, { ConsentChoice } from '@/components/consent/bar';
import {
  cleanOptionalStorage,
  getConsent,
  setConsent,
  track,
} from '@/lib/consent/client';
import {
  consentDismissed,
  forgetConsentDismissal,
  rememberConsentDismissal,
} from '@/lib/consent/dismissal';
import { privacyUrl } from '@/lib/consent/endpoints';
import {
  marketingGranted,
  writeMarketingFlag,
} from '@/lib/consent/grant';
import { Consent, denied, Selection, toSelection } from '@/lib/consent/policy';
import { captureTorobClick } from '@/lib/consent/torob-client';

const all: Selection = {
  preferences: true,
  analytics: true,
  marketing: true,
};

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

export default function ConsentManager() {
  const [banner, showBanner] = useState(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<ConsentChoice | null>(null);
  const [error, setError] = useState('');
  const revision = useRef(0);

  useEffect(() => {
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
        // Mirror the decision where page scripts can read it synchronously;
        // `setConsent` notifies the Yektanet gate in <head> right after.
        writeMarketingFlag(marketingGranted(d.consent));
        setConsent(d.consent);
        // A visitor who already chose is never asked again; one who only closed
        // the bar earlier in this session is not asked again either.
        showBanner(!d.consent && !consentDismissed());
        cleanOptionalStorage();
      })
      .catch(() => showBanner(true))
      .finally(() => setReady(true));
    return () => {
      window.removeEventListener('pageshow', restore);
      channel?.close();
    };
  }, []);

  async function save(value: Selection, choice: ConsentChoice) {
    revision.current++;
    setPending(choice);
    setError('');
    const previous = getConsent();
    // Stop local event dispatch immediately, including while withdrawal is being saved.
    setConsent(null);
    try {
      const r = await fetch(privacyUrl('consent'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...toSelection(value), choice }),
      });
      if (!r.ok) throw new Error();
      const data: { consent: Consent } = await r.json();
      writeMarketingFlag(marketingGranted(data.consent));
      setConsent(data.consent);
      cleanOptionalStorage();
      forgetConsentDismissal();
      showBanner(false);
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
      setError('انتخاب ذخیره نشد. دوباره تلاش کنید.');
      showBanner(true);
    } finally {
      setPending(null);
    }
  }

  /** Closing only hides the bar: it never grants analytics or marketing. */
  const close = useCallback(() => {
    rememberConsentDismissal();
    setError('');
    showBanner(false);
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageTracking />
      </Suspense>

      {ready && banner && (
        <ConsentBar
          pending={pending}
          error={error}
          onAcceptAll={() => void save(all, 'all')}
          onAcceptNecessary={() => void save(denied, 'reject')}
          onClose={close}
        />
      )}
    </>
  );
}
