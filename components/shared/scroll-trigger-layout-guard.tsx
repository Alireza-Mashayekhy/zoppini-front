'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect } from 'react';

gsap.registerPlugin(ScrollTrigger);

/** حداقل تغییر ارتفاع صفحه (پیکسل) که ارزش یک refresh دارد */
const MIN_HEIGHT_CHANGE = 8;

/** کمی صبر می‌کنیم تا تغییر چیدمان تمام شود */
const SETTLE_DELAY = 250;

/**
 * نگهبان چیدمان برای ScrollTrigger.
 *
 * ScrollTrigger خودش روی `resize`، `load` و `visibilitychange` سایزها را
 * دوباره می‌گیرد؛ اما اگر ارتفاع صفحه بدون تغییر اندازه پنجره عوض شود
 * (مثلاً SaleBanner بعد از hydration نسخه موبایل را با نسبت تصویر دیگری
 * رندر کند، یا محتوایی به بالای یک سکشن پین‌شده اضافه/کم شود) موقعیت
 * پین‌ها و طول اسکرول‌ها قدیمی می‌مانند و آن بخش‌ها «به‌هم‌ریخته» دیده
 * می‌شوند. این کامپوننت با ResizeObserver روی body همین حالت را تشخیص
 * می‌دهد و یک‌بار — بعد از فروکش کردن تغییرات — سایزها را دوباره می‌گیرد.
 *
 * برای جلوگیری از حلقه: ارتفاعی که بعد از هر refresh خوانده می‌شود مبنا
 * قرار می‌گیرد و تغییرهای زیر ۸ پیکسل نادیده گرفته می‌شوند.
 */
export default function ScrollTriggerLayoutGuard() {
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let refreshing = false;

    const bodyHeight = () => document.body.offsetHeight;
    let lastHeight = bodyHeight();

    const refresh = () => {
      refreshing = true;
      ScrollTrigger.refresh();
      lastHeight = bodyHeight();

      // یک فریم فرصت می‌دهیم اسپیسرها/استایل‌های پین بنشینند
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          refreshing = false;
        });
      });
    };

    const observer = new ResizeObserver(() => {
      if (refreshing) return;

      const height = bodyHeight();
      if (Math.abs(height - lastHeight) < MIN_HEIGHT_CHANGE) return;

      lastHeight = height;

      clearTimeout(timer);
      timer = setTimeout(refresh, SETTLE_DELAY);
    });

    observer.observe(document.body);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
