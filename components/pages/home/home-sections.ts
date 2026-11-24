/**
 * فهرست بخش‌های اصلی صفحه‌ی اصلی.
 *
 * هر آیتم همان چیزی است که:
 *   • یک «نقطه‌ی توقف» (snap point) در اسکرول صفحه می‌سازد،
 *   • و یک دایره در ناوبری سمت راستِ دسکتاپ می‌گیرد.
 *
 * `id` باید با `id`های واقعی در صفحه یکی باشد؛ اگر بخشی در صفحه نباشد
 * (مثلاً داده‌ای برایش وجود نداشته باشد) ناوبری خودش آن را کنار می‌گذارد.
 */
export interface HomeSectionMeta {
  id: string;
  /** برچسب فارسی؛ برای ابزار دسترس‌پذیری و tooltip دایره‌ها */
  label: string;
  /** آیا این مقصد، فوتر است؟ (برای جداکردن بصری و رفتار پیمایش) */
  isFooter?: boolean;
}

export const HOME_SECTIONS: HomeSectionMeta[] = [
  { id: 'home-sale', label: 'فروش ویژه' },
  { id: 'home-new-in', label: 'جدیدترین‌ها' },
  { id: 'home-hero', label: 'کالکشن' },
  { id: 'home-categories', label: 'دسته‌بندی‌ها' },
  { id: 'home-style', label: 'پیشنهاد استایل' },
  { id: 'home-end', label: 'ویدیوی پایانی' },
];

/** شناسه‌ی فوتر؛ آخرین نقطه‌ی توقف صفحه تا فوتر هم کامل دیده شود. */
export const HOME_FOOTER_ID = 'site-footer';

/**
 * فوتر یک مقصد مستقل در ناوبری است، اما بخش تمام‌صفحه نیست و ارتفاعش را از
 * محتوای خودش می‌گیرد. برای همین از `HOME_SECTIONS` جدا است و فقط در فهرست
 * دایره‌ها (در صورت وجود المان در صفحه) اضافه می‌شود.
 */
export const HOME_FOOTER_NAV: HomeSectionMeta = {
  id: HOME_FOOTER_ID,
  label: 'تماس و اطلاعات',
  isFooter: true,
};

/** دایره‌های ناوبری: همه‌ی بخش‌ها + فوتر */
export const HOME_NAV_ITEMS: HomeSectionMeta[] = [
  ...HOME_SECTIONS,
  HOME_FOOTER_NAV,
];
