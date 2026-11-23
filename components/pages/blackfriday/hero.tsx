import { getImageProps } from 'next/image';

import styles from './hero.module.css';

/**
 * بخش یکم — هیروی کمپین.
 *
 * دقیقاً همان هنر تأییدشدهٔ کمپین: پوستر «BLACK FRIDAY» زوپینی، بدون هیچ
 * متن یا پردهٔ اضافه روی آن. دو فایل مستقل با `<picture>` جابه‌جا می‌شوند
 * (دسکتاپ ۱۶:۹ و موبایل ۹:۱۶) تا در هر اندازه هیچ بخشی از پوستر بریده نشود.
 *
 * `getImageProps` همان بهینه‌سازی `next/image` (WebP/AVIF و srcset واکنش‌گرا)
 * را روی هر دو فایل اعمال می‌کند، بدون اینکه مرورگر فایل پنهان را دانلود کند.
 * عکس تنها محتوای دیداری این بخش است، پس `alt` معنای پوستر را می‌رساند و
 * برای ساختار صفحه یک `h1` واقعی (فقط برای صفحه‌خوان/سئو، نامرئی) هم هست.
 */
const DESKTOP_BANNER = {
  src: '/campaign/blackfriday/hero-banner-desktop.png',
  width: 6666,
  height: 3750,
};

const MOBILE_BANNER = {
  src: '/campaign/blackfriday/hero-banner-mobile.png',
  width: 1152,
  height: 2048,
};

const ALT =
  'پوستر بلک‌فرایدی زوپینی؛ نوشتهٔ BLACK FRIDAY و تا ۷۰٪ تخفیف پوشاک مردانهٔ کلاسیک';

export function Hero() {
  const { props: desktopProps } = getImageProps({
    ...DESKTOP_BANNER,
    alt: ALT,
    sizes: '100vw',
    loading: 'eager',
    fetchPriority: 'high',
  });

  const { props: mobileProps } = getImageProps({
    ...MOBILE_BANNER,
    alt: ALT,
    sizes: '100vw',
  });

  return (
    <section className={styles.hero} aria-label="کمپین بلک فرایدی زوپینی">
      <h1 id="blackfriday-heading" className={styles.visuallyHidden}>
        بلک‌فرایدی زوپینی؛ تا ۷۰٪ تخفیف پوشاک مردانهٔ کلاسیک
      </h1>

      <picture className={styles.picture}>
        <source
          media="(max-width: 767px)"
          srcSet={mobileProps.srcSet}
          sizes={mobileProps.sizes}
          width={mobileProps.width}
          height={mobileProps.height}
        />
        <img {...desktopProps} alt={ALT} className={styles.banner} />
      </picture>

      {/* میان‌بر کیبورد برای رفتن مستقیم به فهرست محصولات */}
      <a className={styles.skipLink} href="#collection">
        پرش به فهرست محصولات
      </a>
    </section>
  );
}
