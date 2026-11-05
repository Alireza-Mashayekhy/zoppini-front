'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { initializeGoogleAnalytics, sendGooglePageView } from '@/lib/google-analytics';

/** Independent of the site's first-party consent-controlled analytics. */
export default function GoogleAnalytics() {
  const path = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    initializeGoogleAnalytics();
    if (path && lastPath.current !== path) {
      lastPath.current = path;
      sendGooglePageView();
    }
  }, [path]);

  return null;
}
