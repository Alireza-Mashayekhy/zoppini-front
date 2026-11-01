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
 */
export default function SaleBanner({ image }: { image?: HomeImageData }) {
  if (!image) {
    return null;
  }

  return (
    <Link
      href={image.linkUrl || '/products'}
      aria-label={image.alt}
      className="relative block w-full overflow-hidden bg-neutral-200 aspect-[9/16] max-h-[80vh] sm:aspect-[16/9] sm:max-h-none"
    >
      <HomeImage image={image} />
    </Link>
  );
}
