/**
 * آدرس فایل‌های آپلودشده.
 *
 * در دیتابیس فقط مسیر نسبی ذخیره می‌شود (مثل `images/xyz.webp`) تا
 * دامنه‌ی سرو فایل‌ها بین محیط‌ها قابل تغییر باشد؛ اینجا با
 * NEXT_PUBLIC_IMAGE_URL کامل می‌شود.
 */
export function mediaUrl(path?: string | null): string {
  if (!path) return '';

  if (/^https?:\/\//i.test(path)) return path;

  const base = process.env.NEXT_PUBLIC_IMAGE_URL ?? '';

  /**
   * اگر متغیر محیطی ست نشده باشد (مثلاً اجرای لوکال بدون .env) مسیر
   * نسبی با اسلش برگردانده می‌شود تا next/image خطا ندهد.
   */
  if (!base) return path.startsWith('/') ? path : `/${path}`;

  return `${base}${path}`;
}

export function isVideoPath(path?: string | null): boolean {
  if (!path) return false;

  return /\.(mp4|webm|ogv|m4v)(\?.*)?$/i.test(path);
}
