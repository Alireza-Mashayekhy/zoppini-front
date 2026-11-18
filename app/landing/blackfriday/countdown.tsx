'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  CAMPAIGN_LAUNCH_UTC_MS,
  formatCountdownUnit,
  remainingUntilLaunch,
} from '@/lib/campaign-launch';

import styles from './blackfriday.module.css';

const ClockContext = createContext<ReturnType<
  typeof remainingUntilLaunch
> | null>(null);

function useCampaignClock() {
  const clock = useContext(ClockContext);
  if (!clock) throw new Error('Campaign clock provider is missing');
  return clock;
}

export function CampaignClock({
  serverNowMs,
  children,
}: {
  serverNowMs: number;
  children: ReactNode;
}) {
  const [nowMs, setNowMs] = useState(serverNowMs);
  const router = useRouter();

  useEffect(() => {
    if (serverNowMs >= CAMPAIGN_LAUNCH_UTC_MS) return;
    // The first client render matches SSR. Advance by monotonic elapsed time,
    // not the visitor's wall clock or a count of (possibly throttled) ticks.
    const startedAt = performance.now();
    let timeout: number;
    const schedule = (remainingMs: number) => {
      timeout = window.setTimeout(tick, remainingMs % 1000 || 1000);
    };
    const tick = () => {
      const now = serverNowMs + performance.now() - startedAt;
      setNowMs(now);
      const remainingMs = CAMPAIGN_LAUNCH_UTC_MS - now;
      if (remainingMs > 0) schedule(remainingMs);
    };
    schedule(CAMPAIGN_LAUNCH_UTC_MS - serverNowMs);

    // A fresh server sample also covers browsers whose monotonic clock stops
    // during OS sleep, and documents restored by the back/forward cache.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) router.refresh();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onPageShow);

    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [router, serverNowMs]);

  return (
    <ClockContext.Provider value={remainingUntilLaunch(nowMs)}>
      {children}
    </ClockContext.Provider>
  );
}

export function CampaignPhaseCopy({
  before,
  after,
}: {
  before: string;
  after: string;
}) {
  return useCampaignClock().expired ? after : before;
}

const units = [
  { key: 'days', label: 'روز' },
  { key: 'hours', label: 'ساعت' },
  { key: 'minutes', label: 'دقیقه' },
  { key: 'seconds', label: 'ثانیه' },
] as const;

export function Countdown() {
  const parts = useCampaignClock();

  if (parts.expired) {
    return (
      <div className={`${styles.persian} max-w-md text-right`} dir="rtl">
        <div role="status">
          <p className="text-sm text-[var(--cs-crimson)]">اکنون فعال است</p>
          <p className="mt-3 text-2xl leading-9 text-[var(--cs-ivory)]">
            کمپین آغاز شده است.
          </p>
        </div>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-12 items-center justify-center bg-[var(--cs-crimson)] px-7 text-sm text-[var(--cs-white)] transition-colors hover:bg-[var(--cs-burgundy)]"
        >
          ورود به مجموعه
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`${styles.persian} w-full max-w-lg`}
      role="timer"
      aria-label="زمان باقی‌مانده تا شروع کمپین"
    >
      <div dir="ltr" className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
        {units.map(unit => (
          <div
            key={unit.key}
            className={`${styles.unit} flex min-w-0 flex-col items-center px-1 py-3 sm:px-2 sm:py-4`}
          >
            <span className="text-[1.65rem] leading-none text-[var(--cs-ivory)] sm:text-4xl md:text-5xl">
              {formatCountdownUnit(parts[unit.key])}
            </span>
            <span
              className="mt-2 text-[0.7rem] leading-6 text-[var(--cs-ivory)]/70 sm:text-xs"
              dir="rtl"
            >
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
