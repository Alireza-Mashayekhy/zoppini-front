import { ClubCustomer } from './type';

/**
 * نرمال‌سازی پاسخ‌های باشگاه مشتریان (دایاتک)
 *
 * مستند دایاتک همه‌ی DTOها را با پوشش `{ Succeeded, Payload, Errors }` معرفی
 * می‌کند، اما پیاده‌سازی‌ها در عمل یکی از این شکل‌ها را برمی‌گردانند:
 *
 *   - آرایه‌ی خام:                         `[{ Id: 1 }, ...]`
 *   - پوشش استاندارد دایاتک:               `{ Succeeded: true, Payload: [...] }`
 *   - پوشش صفحه‌بندی‌شده:                    `{ Payload: { Items: [...], TotalCount } }`
 *   - پوشش System.Text.Json با PreserveReferences: `{ $values: [...] }`
 *   - پوشش عمومی `{ success: true, data: [...] }`
 *
 * همه‌ی این‌ها باید به «آرایه‌ای از آبجکت» تبدیل شوند؛ در غیر این صورت
 * `payload.map(...)` در رندر کامپوننت خطا می‌دهد و - چون خطای رندر در یک
 * کامپوننت کلاینت بدون Error Boundary کل صفحه را از کار می‌اندازد - صفحه‌ی
 * باشگاه مشتریان بعد از بارگذاری داده «یک‌دفعه ارور» می‌داد.
 */

const LIST_WRAPPER_KEYS = [
  'Payload',
  'payload',
  'Data',
  'data',
  'Items',
  'items',
  'Results',
  'results',
  'Records',
  'records',
  'List',
  'list',
  'Rows',
  'rows',
  '$values',
];

const CUSTOMER_WRAPPER_KEYS = [
  'Payload',
  'payload',
  'Data',
  'data',
  'Result',
  'result',
  'Customer',
  'customer',
];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * تبدیل هر شکل پاسخ به آرایه‌ای از آبجکت‌ها.
 * مقادیر تهی (null/undefined/رشته/عدد) به آرایه‌ی خالی تبدیل می‌شوند تا
 * رندر هیچ‌وقت روی `undefined.map` نشکند.
 */
export function asArray<T>(value: unknown, depth = 0): T[] {
  if (Array.isArray(value)) {
    return value.filter(isPlainObject) as T[];
  }

  if (!isPlainObject(value) || depth >= 4) {
    return [];
  }

  for (const key of LIST_WRAPPER_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;

    const nested = value[key];

    // برای پوشش‌های استاندارد دایاتک، حتی اگر لیست خالی باشد همان را
    // برمی‌گردانیم (تا به‌جای رفتن به سراغ کلید بعدی، «لیست خالی» گزارش شود).
    if (Array.isArray(nested) || isPlainObject(nested) || nested == null) {
      return asArray<T>(nested, depth + 1);
    }
  }

  return [];
}

/**
 * استخراج آبجکت مشتری از پاسخ `/club/me`.
 * اگر پاسخ اصلاً مشتری نداشته باشد `null` برمی‌گردد تا کامپوننت حالت
 * «دریافت نشد» را نشان دهد، نه این‌که با `undefined` کرش کند.
 */
export function asCustomer(value: unknown, depth = 0): ClubCustomer | null {
  if (!isPlainObject(value) || depth >= 4) return null;

  const looksLikeCustomer =
    'CustomerCode' in value ||
    'FirstName' in value ||
    'LastName' in value ||
    'TotalPoint' in value ||
    'AvailableCredit' in value ||
    'Coupons' in value ||
    'Wallets' in value;

  if (looksLikeCustomer) {
    return value as unknown as ClubCustomer;
  }

  for (const key of CUSTOMER_WRAPPER_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;

    const nested = asCustomer(value[key], depth + 1);

    if (nested) return nested;
  }

  return null;
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** تبدیل ارقام فارسی/عربی به لاتین (دایاتک گاهی اعداد را این‌طور می‌فرستد) */
const toLatinDigits = (value: string): string =>
  value.replace(/[۰-۹٠-٩]/g, digit => {
    const persianIndex = PERSIAN_DIGITS.indexOf(digit);

    if (persianIndex !== -1) return String(persianIndex);

    return String(ARABIC_DIGITS.indexOf(digit));
  });

/**
 * تبدیل امن مقدار عددی؛ فیلدهای دایاتک گاهی به‌صورت رشته (با جداکننده هزارگان
 * یا ارقام فارسی) برمی‌گردند. در صورت نامعتبر بودن، مقدار پیش‌فرض استفاده
 * می‌شود تا `formatPrice` هیچ‌وقت `NaN` نشان ندهد.
 */
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string') {
    const normalized = Number(
      toLatinDigits(value).replace(/[,\s\u066c\u060c]/g, ''),
    );

    return Number.isFinite(normalized) ? normalized : fallback;
  }

  return fallback;
}

/**
 * شناسه‌ی کیف پول؛ فقط اگر عدد معتبر و بزرگ‌تر از صفر بود قابل استفاده است
 * (برای فراخوانی endpoint تراکنش‌ها).
 */
export const toWalletId = (value: unknown): number => {
  const id = Math.trunc(toNumber(value));

  return Number.isFinite(id) && id > 0 ? id : 0;
};
