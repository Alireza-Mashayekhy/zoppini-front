'use client';

import { useEffect, useState } from 'react';

import HlsVideo from '@/components/shared/hls-video';
import { HomeImage } from '@/lib/home-images';

/**
 * ویدیوی پایانی صفحه‌ی اصلی — یک بخش کامل تمام‌صفحه.
 *
 * انتخاب نسخه‌ی موبایل/دسکتاپ با بریک‌پوینت ۷۶۸px و بر اساس عرض واقعی پنجره
 * انجام می‌شود — نه User-Agent؛ قبلاً روی تبلت/اندروید با نمایشگر بزرگ نسخه‌ی
 * اشتباه (و چه بسا ویدیوی 4K) دانلود می‌شد.
 *
 * ── تغییر نسبت به قبل ──────────────────────────────────────────────────────
 * قبلاً یک ScrollTrigger این بخش را ۵۰۰px pin می‌کرد. pin یعنی صفحه برای
 * مدتی «قفل» می‌شود؛ همان چیزی که حس «چند بار باید چرخ ماوس را بچرخانم» را
 * می‌ساخت. اکنون ویدیو فقط تمام‌صفحه است و اسکرول اسنپ خودش آن را در جای
 * خودش نگه می‌دارد.
 */
export default function EndVideo({
  poster,
}: {
  /**
   * پوستر ویدیوی پایانی (از پنل مدیریت).
   *
   * اگر مدیر تصویری آپلود نکرده باشد، پوسترهای پیش‌فرض سایت استفاده می‌شوند.
   */
  poster?: HomeImage;
} = {}) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');

    const update = () => setIsMobile(query.matches);

    update();
    query.addEventListener('change', update);

    return () => query.removeEventListener('change', update);
  }, []);

  return (
    <section
      id="home-end"
      data-home-section
      aria-label="ویدیوی پایانی"
      className="home-section home-section--full relative w-full overflow-hidden bg-black"
    >
      {isMobile !== null && (
        <HlsVideo
          key={isMobile ? 'mobile' : 'desktop'}
          src={
            isMobile ? '/home/mobile_end/master.m3u8' : '/home/end/master.m3u8'
          }
          poster={
            /* تصویر موبایل اختیاری است؛ اگر نباشد همان دسکتاپ استفاده می‌شود */
            isMobile
              ? poster?.mobile ||
                poster?.desktop ||
                '/home/mobile_end/poster.webp'
              : poster?.desktop || '/home/end/poster.webp'
          }
          preload="metadata"
          className="w-full h-full object-cover"
        />
      )}
    </section>
  );
}
