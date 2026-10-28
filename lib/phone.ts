/**
 * ابزارهای مشترک شماره موبایل در سمت کلاینت.
 *
 * کاربر ممکن است شماره را با اعداد فارسی/عربی (۰۹۱۲…)، با فاصله یا خط‌تیره،
 * یا با پیش‌شماره بین‌المللی (+۹۸ / ۰۰۹۸ / ۹۸) وارد کند. یکدست‌سازی قبل از
 * ارسال، از خطاهای «شماره نامعتبر» و ساخت کلید/کاربر تکراری در بک‌اند جلوگیری
 * می‌کند.
 */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export const IRAN_MOBILE_REGEX = /^09\d{9}$/;

export const PHONE_ERROR_MESSAGE = 'شماره موبایل وارد شده اشتباه است.';

/** ارقام فارسی/عربی را به لاتین تبدیل می‌کند. */
export function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, digit => {
    const persianIndex = PERSIAN_DIGITS.indexOf(digit);
    if (persianIndex > -1) return String(persianIndex);

    const arabicIndex = ARABIC_DIGITS.indexOf(digit);
    return arabicIndex > -1 ? String(arabicIndex) : digit;
  });
}

/**
 * شماره موبایل را به قالب یکدست `09xxxxxxxxx` تبدیل می‌کند
 * (بدون بررسی معتبر بودن؛ فقط قالب را یکدست می‌کند).
 */
export function normalizeIranMobile(value: string): string {
  if (typeof value !== 'string') return '';

  let digits = toLatinDigits(value).replace(/[\s\-()._]/g, '');

  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }

  if (/^0098\d{10}$/.test(digits)) {
    digits = '0' + digits.slice(4);
  } else if (/^98\d{10}$/.test(digits)) {
    digits = '0' + digits.slice(2);
  } else if (/^9\d{9}$/.test(digits)) {
    digits = '0' + digits;
  }

  return digits;
}

/** آیا ورودی یک شماره موبایل معتبر ایران است؟ */
export function isIranMobile(value: string): boolean {
  return IRAN_MOBILE_REGEX.test(normalizeIranMobile(value));
}
