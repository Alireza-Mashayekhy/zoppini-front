/**
 * فهرست بخش‌های اصلی صفحه‌ی اصلی.
 *
 * هر آیتم همان چیزی است که:
 *   • یک «نقطه‌ی توقف» (snap point) در اسکرول صفحه می‌سازد،
 *   • و یک دایره در ناوبری سمت راستِ دسکتاپ می‌گیرد.
 *
 * `id` باید با `id`های واقعی در `app/(public)/page.tsx` یکی باشد؛ اگر بخشی در
 * صفحه نباشد (مثلاً داده‌ای برایش وجود نداشته باشد) ناوبری خودش آن را کنار
 * می‌گذارد.
 */
export interface HomeSectionMeta {
  id: string;
  /** برچسب فارسی؛ برای ابزار دسترس‌پذیری و tooltip دایره‌ها */
  label: string;
}

export const HOME_SECTIONS: HomeSectionMeta[] = [
  { id: 'home-hero', label: 'کالکشن' },
  { id: 'home-new-in', label: 'جدیدترین‌ها' },
  { id: 'home-sale', label: 'فروش ویژه' },
  { id: 'home-categories', label: 'دسته‌بندی‌ها' },
  { id: 'home-style', label: 'پیشنهاد استایل' },
  { id: 'home-end', label: 'ویدیوی پایانی' },
];

/** شناسه‌ی فوتر؛ آخرین نقطه‌ی توقف صفحه تا فوتر هم کامل دیده شود. */
export const HOME_FOOTER_ID = 'site-footer';
