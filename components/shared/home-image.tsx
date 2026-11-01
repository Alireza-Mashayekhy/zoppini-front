import { HomeImage as HomeImageData } from '@/lib/home-images';
import { cn } from '@/lib/utils';

/**
 * رندر یک تصویر صفحه اصلی که مدیر می‌تواند از پنل عوض کند.
 *
 * از `<picture>` استفاده می‌شود تا مرورگر خودش نسخه‌ی موبایل/دسکتاپ را
 * انتخاب کند و فقط **یک** فایل دانلود شود:
 *
 * - اگر مدیر تصویر موبایل آپلود کرده باشد → روی موبایل همان، روی بقیه
 *   اندازه‌ها تصویر دسکتاپ.
 * - اگر تصویر موبایل آپلود نشده باشد → هیچ `<source>` موبایلی وجود ندارد و
 *   مرورگر تصویر دسکتاپ را نمایش می‌دهد (همان رفتار خواسته‌شده).
 *
 * تصویر داخل کانتینری absolute رندر می‌شود؛ والد باید `relative` و
 * نسبت‌ابعاد (`aspect-*`) داشته باشد.
 */
export default function HomeImage({
  image,
  className,
  priority = false,
}: {
  image: HomeImageData;
  className?: string;
  /** تصویر بالای صفحه (LCP) → دانلود با اولویت بالا */
  priority?: boolean;
}) {
  return (
    <picture className="contents">
      {image.mobile && (
        <source media="(max-width: 767px)" srcSet={image.mobile} />
      )}

      <img
        src={image.desktop}
        alt={image.alt}
        className={cn(
          'absolute inset-0 h-full w-full object-cover',
          priority ? '' : 'bg-neutral-200',
          className,
        )}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        draggable={false}
      />
    </picture>
  );
}
