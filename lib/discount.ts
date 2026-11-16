/**
 * محاسبه و نمایش «درصد تخفیف» برای کارت‌های محصول و صفحه‌ی جزئیات.
 *
 * - درصد فقط از مقادیر عددی‌ای ساخته می‌شود که بک‌اند برگردانده، نه از متنِ
 *   قالب‌بندی‌شده (never from formatted strings).
 * - اگر تخفیف نامعتبر باشد (صفر/منفی/بیشتر یا مساوی قیمت پایه و ارتباط عجیب
 *   با هم)، `null` برمی‌گردد تا هیچ badge بی‌معنایی نشان داده نشود.
 */

/**
 * تبدیل امن به عدد پایه‌ی مثبت.
 *
 * صفر/منفی/NaN یعنی «ارزش نامعتبر عددی نیست»؛ برای جلوگیری از نمایش
 * «۰٪ تخفیف» یا «ناN» این‌ها `null` می‌شوند.
 */
function toPositiveNumber(value: unknown): number | null {
  const numeric = Number(value);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

/**
 * درصد تخفیف به‌صورت عدد صحیح (رندشده به پایین نزدیک‌ترین عدد)، یا `null`
 * اگر تخفیف معتبر و قابل محاسبه نباشد.
 *
 * رابطه: round((regular - sale) / regular * 100)
 *
 * قانون «never show without valid discount»: وقتی تخفیف صفر یا نامعتبر
 * (مثلاً قیمت با تخفیف بزرگ‌تر از قیمت پایه) باشد null برمی‌گردد تا
 * badge قرمز اشتباهی نمایش داده نشود.
 */
export function discountPercent(
  regularPrice: number | string | null | undefined,
  discountedPrice: number | string | null | undefined,
): number | null {
  const regular = toPositiveNumber(regularPrice);
  const discounted = toPositiveNumber(discountedPrice);

  if (regular === null || discounted === null) return null;
  if (discounted >= regular) return null;

  const percent = Math.round(((regular - discounted) / regular) * 100);

  if (!Number.isFinite(percent) || percent <= 0) return null;

  return percent;
}

/** فرمت چاردهی اعداد فارسی در قالب‌بندی تومان. */
const FA_NUMBER_FORMAT = new Intl.NumberFormat('fa-IR', {
  useGrouping: true,
});

/**
 * نمایش عدد قیمت با رقم فارسی (همان convention restuarantِ بقیه‌ی صفحات).
 */
export function formatPriceFa(value: number | string | null | undefined): string {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) return '';
  return FA_NUMBER_FORMAT.format(Math.round(numeric));
}
