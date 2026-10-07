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

/**
 * برعکس `mediaUrl`: URL کامل را به مسیر نسبی ذخیره‌سازی تبدیل می‌کند.
 *
 * ادیتور تصویرها را برای پیش‌نمایش با دامنه‌ی کامل نشان می‌دهد، ولی در
 * متن همیشه مسیر نسبی ذخیره می‌شود تا با تغییر دامنه/CDN چیزی خراب نشود.
 */
export function toStoredPath(url?: string | null): string {
  if (!url) return '';

  const base = process.env.NEXT_PUBLIC_IMAGE_URL ?? '';

  if (base && url.startsWith(base)) {
    return url.slice(base.length).replace(/^\//, '');
  }

  return url;
}

export function isVideoPath(path?: string | null): boolean {
  if (!path) return false;

  return /\.(mp4|webm|ogv|m4v)(\?.*)?$/i.test(path);
}


/**
 * کامل‌کردن آدرس رسانه‌های داخل یک رشته HTML.
 *
 * ادیتور متن، آدرس فایل‌ها را به‌شکل نسبی ذخیره می‌کند (مثل
 * `images/x.webp`) تا وابسته به دامنه نباشد؛ هر جا HTML خام رندر می‌شود
 * (مقاله، توضیحات محصول، توضیحات دسته‌بندی) با این تابع آدرس کامل
 * می‌شود.
 */
export function resolveHtmlMedia(html?: string | null): string {
  if (!html) return '';

  const base = process.env.NEXT_PUBLIC_IMAGE_URL ?? '';
  if (!base) return html;

  return html.replace(
    /(\bsrc|\bposter)\s*=\s*(["'])([^"']*)\2/gi,
    (match, attribute: string, quote: string, url: string) => {
      if (!url || /^(https?:|data:|blob:|\/\/)/i.test(url)) return match;

      return `${attribute}=${quote}${mediaUrl(url)}${quote}`;
    },
  );
}
