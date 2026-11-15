/**
 * ساخت داده‌ی ساختاریافته‌ی BreadcrumbList.
 *
 * JSON-LD برای اینکه معتبر باشد باید آدرس‌های مطلق داشته باشد؛ نسخه‌ی قبلی
 * مسیرهای نسبی (مثل `/product-category/shirt`) را منتشر می‌کرد که برای گوگل
 * نامعتبر است. این ماژول خالص است تا تست‌پذیر باشد.
 */

const SITE_URL = 'https://zoppinico.com';

export interface BreadcrumbInputItem {
  name?: string | null;
  href?: string | null;
}

/** آدرس مطلق و canonical برای یک مسیر نسبی یا آدرس کامل. */
export function toBreadcrumbUrl(pathOrUrl: string): string | null {
  try {
    const url = new URL(pathOrUrl, SITE_URL);

    if (url.hash) url.hash = '';

    // آدرس canonical صفحه‌ی اصلی بدون اسلش انتهایی است.
    if (url.pathname === '/') return SITE_URL;

    return url.toString();
  } catch {
    return null;
  }
}

/**
 * ساختار BreadcrumbList یا `null` اگر مسیرِ ناوبری معتبر نباشد.
 *
 * - آیتم‌های بدون نام یا بدون آدرسِ قابل‌حل حذف می‌شوند (آیتم خالی/نامعتبر)؛
 * - آیتم تکراری (نام و آدرسِ یکسان با آیتم قبلی) حذف می‌شود؛
 * - موقعیت‌ها بعد از فیلتر کردن بازشماره‌گذاری می‌شوند تا `position` پیوسته
 *   و درست بماند.
 */
export function buildBreadcrumbJsonLd(
  items?: BreadcrumbInputItem[] | null,
): Record<string, unknown> | null {
  if (!items?.length) return null;

  const seen = new Set<string>();
  const itemListElement: Record<string, unknown>[] = [];

  for (const item of items) {
    const name = item?.name?.trim();
    const itemUrl = item?.href ? toBreadcrumbUrl(item.href) : null;

    // آیتم‌های ناقص یا نامعتبر منتشر نمی‌شوند.
    if (!name || !itemUrl) continue;

    const key = `${name}|${itemUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);

    itemListElement.push({
      '@type': 'ListItem',
      position: itemListElement.length + 1,
      name,
      item: itemUrl,
    });
  }

  // حداقل دو آیتم لازم است تا یک مسیر ناوبری معنا داشته باشد.
  if (itemListElement.length < 2) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}
