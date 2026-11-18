/**
 * مقادیر مرتب‌سازی لیست محصولات.
 *
 * این مقدارها عیناً به‌صورت `sort=field:direction` به بک‌اند فرستاده می‌شوند
 * و بک‌اند با همان جهت (ASC/DESC) مرتب می‌کند. پس برای «جدیدترین» باید
 * `desc` باشد (تاریخ نزولی).
 *
 * «پرفروش‌ترین» به `sold:desc` وصل است؛ بک‌اند این فیلد را از مجموع تعداد
 * اقلام سفارش‌های پرداخت‌شده/ارسال‌شده/تحویل‌شده (به‌جز لغوشده‌ها) محاسبه
 * می‌کند، نه از یک مرتب‌سازی دیگر با برچسب عوض‌شده.
 */
export const PRODUCT_SORT_NEWEST = 'createdAt:desc';
export const PRODUCT_SORT_CHEAPEST = 'price:asc';
export const PRODUCT_SORT_MOST_EXPENSIVE = 'price:desc';
export const PRODUCT_SORT_BEST_SELLING = 'sold:desc';

/** ترتیب پیش‌فرض لیست محصولات: جدیدترین‌ها اول */
export const DEFAULT_PRODUCT_SORT = PRODUCT_SORT_NEWEST;

/** گزینه‌های منوی مرتب‌سازی، دقیقاً به همین ترتیب نمایش */
export const PRODUCT_SORT_OPTIONS = [
  { value: PRODUCT_SORT_CHEAPEST, label: 'کمترین قیمت' },
  { value: PRODUCT_SORT_MOST_EXPENSIVE, label: 'بیشترین قیمت' },
  { value: PRODUCT_SORT_BEST_SELLING, label: 'پرفروش‌ترین' },
  { value: PRODUCT_SORT_NEWEST, label: 'جدیدترین' },
] as const;
