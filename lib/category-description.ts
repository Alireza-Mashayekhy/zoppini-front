import sanitizeHtml from 'sanitize-html';

/**
 * توضیحات دسته‌بندی در پنل با ویرایشگر متن غنی نوشته می‌شود.
 * ساختار متن (تیتر، بند، لیست، لینک) حفظ می‌شود، ولی HTML هرگز خام و
 * بدون پاک‌سازی در صفحه‌ی عمومی قرار نمی‌گیرد.
 */
export function cleanCategoryDescription(html?: string | null): string {
  return sanitizeHtml(html || '', {
    allowedTags: [
      'p',
      'br',
      'h2',
      'h3',
      'h4',
      'ul',
      'ol',
      'li',
      'strong',
      'em',
      'b',
      'i',
      'a',
    ],
    allowedAttributes: { a: ['href', 'title'] },
    allowedSchemes: ['http', 'https', 'mailto'],
  }).trim();
}

/**
 * HTML آماده‌ی نمایش توضیحات دسته‌بندی، یا `null` وقتی متن واقعی ندارد.
 *
 * ویرایشگر متن گاهی فقط تگ خالی (`<p></p>`) یا فاصله ذخیره می‌کند؛ چنین
 * مقداری نباید باعث رندر یک بخش خالی با فاصله‌ی اضافه در پایین صفحه شود.
 *
 * هر دو مسیر `/category/[slug]` و `/product-category/[slug]` از همین تابع
 * استفاده می‌کنند تا متن توضیحات در هر دو صفحه دقیقاً یکسان دیده شود.
 */
export function categoryDescriptionHtml(html?: string | null): string | null {
  const clean = cleanCategoryDescription(html);
  const text = clean.replace(/<[^>]*>/g, '');
  // `&nbsp;` پس از پاک‌سازی به‌صورت متن باقی می‌ماند و متن واقعی نیست.
  return text.replace(/&nbsp;/g, ' ').trim().length > 0 ? clean : null;
}
