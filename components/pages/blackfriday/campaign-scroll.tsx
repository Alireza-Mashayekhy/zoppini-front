'use client';

import { useEffect } from 'react';

/**
 * رفتار اسکرولِ کمپین روی موبایل (بخش‌های تمام‌صفحه با snap).
 *
 * مثل صفحهٔ اصلی (`html.home-scroll`)، کلاس فقط تا وقتی این صفحه باز است روی
 * `html` می‌نشیند و در unmount برداشته می‌شود؛ بنابراین اسکرول هیچ صفحهٔ
 * دیگری تغییر نمی‌کند و `globals.css` هم دست نمی‌خورد.
 */
export function CampaignScroll() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('blackfriday-scroll');
    return () => root.classList.remove('blackfriday-scroll');
  }, []);

  return null;
}
