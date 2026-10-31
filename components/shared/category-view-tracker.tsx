'use client';
import { useEffect } from 'react';

import { track } from '@/lib/consent/client';
export default function CategoryViewTracker({ id }: { id: number }) {
  useEffect(() => {
    const run = () => {
      void track('category_view', { category: id });
    };
    window.addEventListener('analytics-page', run);
    return () => window.removeEventListener('analytics-page', run);
  }, [id]);
  return null;
}
