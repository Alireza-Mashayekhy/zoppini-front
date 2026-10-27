'use client';

import { useEffect } from 'react';

import { loadSupportWidget } from '@/lib/consent/support-widget';

export default function SupportWidget() {
  useEffect(() => {
    const load = () => {
      loadSupportWidget();
    };
    window.addEventListener('privacy-changed', load);
    load();
    return () => window.removeEventListener('privacy-changed', load);
  }, []);
  // The consent manager reloads the document after withdrawal to unload SDK code.
  return null;
}
