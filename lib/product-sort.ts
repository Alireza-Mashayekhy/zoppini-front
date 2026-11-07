/**
 * مقادیر مرتب‌سازی لیست محصولات.
 *
 * این مقدارها عیناً به‌صورت `sort=field:direction` به بک‌اند فرستاده می‌شوند
 * و بک‌اند با همان جهت (ASC/DESC) مرتب می‌کند. پس برای «جدیدترین» باید
 * `desc` باشد (تاریخ نزولی)؛ `asc` یعنی قدیمی‌ترین‌ها اول.
 */
export const PRODUCT_SORT_NEWEST = 'createdAt:desc';
export const PRODUCT_SORT_OLDEST = 'createdAt:asc';
export const PRODUCT_SORT_CHEAPEST = 'price:asc';
export const PRODUCT_SORT_MOST_EXPENSIVE = 'price:desc';

/** ترتیب پیش‌فرض لیست محصولات: جدیدترین‌ها اول */
export const DEFAULT_PRODUCT_SORT = PRODUCT_SORT_NEWEST;

/** گزینه‌های منوی مرتب‌سازی، به ترتیب نمایش */
export const PRODUCT_SORT_OPTIONS = [
  { value: PRODUCT_SORT_NEWEST, label: 'جدیدترین' },
  { value: PRODUCT_SORT_OLDEST, label: 'قدیمی‌ترین' },
  { value: PRODUCT_SORT_CHEAPEST, label: 'ارزان‌ترین' },
  { value: PRODUCT_SORT_MOST_EXPENSIVE, label: 'گران‌ترین' },
] as const;
