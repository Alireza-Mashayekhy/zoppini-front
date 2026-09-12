'use client';

import { useEffect, useRef } from 'react';

import { trackVisit } from '@/services/features/visits/track';

export function VisitTracker({
  page,
}: {
  page: 'landing-opening' | 'gamification';
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    // کمی صبر می‌کنیم تا LCP/اولین رندر تحت تاثیر درخواست قرار نگیرد
    const timer = setTimeout(() => {
      void trackVisit(page);
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
