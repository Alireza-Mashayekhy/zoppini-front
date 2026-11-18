import Link from 'next/link';

import HomeImage from '@/components/shared/home-image';
import { HomeImage as HomeImageData } from '@/lib/home-images';

/**
 * بنر فروش ویژه‌ی صفحه‌ی اصلی — اسلاید سوم.
 *
 * تصویر و لینک از پنل مدیریت (`/admin/site-images`) می‌آید؛ اگر چیزی آپلود
 * نشده باشد، تصویر پیش‌فرض قبلی سایت نمایش داده می‌شود.
 *
 * ── اندازه ─────────────────────────────────────────────────────────────────
 * بنر تمام عرض صفحه و تمام فضای زیر هدر را پر می‌کند (بدون قابِ وسط‌چین و
 * بدون حاشیه‌ی کناری). تصویر با `object-cover` در همان نسبت خودش (۱۶:۹
 * دسکتاپ، ۹:۱۶ موبایل) رندر می‌شود؛ پس هرگز کشیده نمی‌شود و فقط اگر نسبت
 * صفحه با نسبت تصویر نخواند، بخشی از لبه‌ها بریده می‌شود. به این ترتیب
 * محتوای اسلاید بعدی هم از پایین سرک نمی‌کشد.
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
      className="home-section home-section--full home-section--below-header relative w-full overflow-hidden bg-background"
    >
      <Link
        href={image.linkUrl || '/products'}
        aria-label={image.alt}
        className="relative block h-full w-full overflow-hidden bg-neutral-200"
      >
        <HomeImage image={image} />
      </Link>
    </section>
  );
}
