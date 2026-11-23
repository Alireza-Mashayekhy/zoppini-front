import { getImageProps } from 'next/image';

import styles from './hero.module.css';

/**
 * بخش یکم — هیروی کمپین.
 *
 * عکس ادیتوریال واقعی (پوشاک مردانهٔ کلاسیک) پس‌زمینه است و همهٔ متن‌ها
 * HTML واقعی روی آن هستند: تیتر، توضیح و دکمهٔ اصلی. بنابراین متن‌ها در هر
 * اندازه‌ای تیز و خوانا می‌مانند، با فونت خود فروشگاه رندر می‌شوند، در
 * جست‌وجو و صفحه‌خوان دیده می‌شوند و با بزرگ‌نمایی مرورگر خراب نمی‌شوند.
 *
 * نسخهٔ موبایل و دسکتاپ دو فایل جدا هستند و با `<picture>` عوض می‌شوند؛
 * `getImageProps` همان بهینه‌سازیِ `next/image` (AVIF/WebP و srcset
 * واکنش‌گرا) را روی هر دو اعمال می‌کند، بدون اینکه فایل پنهان هم دانلود شود.
 */
const DESKTOP_IMAGE = {
  src: '/campaign/blackfriday/hero-desktop.jpg',
  width: 2048,
  height: 1152,
};

const MOBILE_IMAGE = {
  src: '/campaign/blackfriday/hero-mobile.jpg',
  width: 1242,
  height: 2208,
};

/** توضیح عکس، نه تکرار متن تیتر (تیتر و دکمه متن مستقل دارند) */
const ALT =
  'دو مدل مرد در پالتوی دوتیکهٔ خاکستری و کت‌وشلوار زغالی زوپینی در استودیوی تاریک';

export function Hero() {
  const { props: desktopProps } = getImageProps({
    ...DESKTOP_IMAGE,
    alt: ALT,
    sizes: '100vw',
    loading: 'eager',
    fetchPriority: 'high',
  });

  const { props: mobileProps } = getImageProps({
    ...MOBILE_IMAGE,
    alt: ALT,
    sizes: '100vw',
  });

  return (
    <section className={styles.hero} aria-label="کمپین بلک فرایدی زوپینی">
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

      {/* پردهٔ تیره تا متن روی عکس همیشه کنتراست کافی داشته باشد */}
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.content}>
        <p className={styles.eyebrow} dir="ltr" lang="en">
          Black Friday
        </p>

        <h1 className={styles.title}>بلک‌فرایدی زوپینی</h1>

        <p className={styles.lede}>
          تا <span className={styles.highlight}>۷۰٪ تخفیف</span> روی پوشاک
          مردانهٔ کلاسیک
        </p>

        <p className={styles.deadline}>مهلت کمپین: ۸ آذر ۱۴۰۵</p>

        <div className={styles.actions}>
          <a className={styles.primaryCta} href="#collection">
            مشاهده محصولات بلک‌فرایدی
          </a>
          <a className={styles.secondaryCta} href="#categories">
            خرید بر اساس دسته‌بندی
          </a>
        </div>

        {/* همان قول‌های همیشگی فروشگاه؛ فقط روی دسکتاپ برای شلوغ نشدن موبایل */}
        <ul className={styles.perks}>
          <li>ارسال سریع</li>
          <li>ضمانت اصالت کالا</li>
          <li>پرداخت امن</li>
        </ul>
      </div>

      {/* میان‌بر کیبورد برای رفتن مستقیم به فهرست محصولات */}
      <a className={styles.skipLink} href="#collection">
        پرش به فهرست محصولات
      </a>
    </section>
  );
}
