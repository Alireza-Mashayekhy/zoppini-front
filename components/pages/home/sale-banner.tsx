import Link from 'next/link';

import HomeImage from '@/components/shared/home-image';
import { HomeImage as HomeImageData } from '@/lib/home-images';

/**
 * بنر فروش ویژه‌ی صفحه اصلی.
 *
 * تصویر و لینک از پنل مدیریت (`/admin/site-images`) می‌آید؛ اگر چیزی آپلود
 * نشده باشد، تصویر پیش‌فرض قبلی سایت نمایش داده می‌شود.
 *
 * نسخه‌ی موبایل/دسکتاپ با `<picture>` انتخاب می‌شود؛ پس فقط یک تصویر
 * دانلود می‌شود (قبلاً هر دو نسخه در DOM بودند).
 *
 * ── اندازه‌گیری ────────────────────────────────────────────────────────────
 * قاب هم‌نسبت با خودِ تصویر است (۱۶:۹ دسکتاپ، ۹:۱۶ موبایل) و ارتفاعش به
 * فضای واقعی صفحه محدود می‌شود (`home-banner-frame` در styles/home-scroll.css).
 * بنابراین بنر یا کامل در صفحه جا می‌شود یا اگر صفحه کوتاه‌تر از نسبت تصویر
 * باشد، حاشیه‌ی هم‌رنگ پس‌زمینه می‌گیرد — هرگز کشیده یا بریده نمی‌شود.
 */
export default function SaleBanner({ image }: { image?: HomeImageData }) {
  if (!image) {
    return null;
  }

  return (
    <section
      id="home-sale"
      data-home-section
      aria-label="فروش ویژه"
      className="home-section home-section--full home-section--below-header relative flex items-center justify-center bg-background"
    >
      <Link
        href={image.linkUrl || '/products'}
        aria-label={image.alt}
        className="home-media-frame home-media-frame--portrait relative block overflow-hidden bg-neutral-200"
      >
        <HomeImage image={image} />
      </Link>
    </section>
  );
}
