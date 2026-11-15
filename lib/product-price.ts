/**
 * انتخابِ variantِ نمایش‌داده‌شده و محاسبه‌ی «قیمت مؤثر» (با تخفیف).
 *
 * چرا این ماژول وجود دارد:
 * قبل از این، صفحه‌ی محصول و JSON-LD هر کدام قاعده‌ی خودشان را داشتند
 * (صفحه: `variants[0]` / variant انتخاب‌شده؛ JSON-LD: کمترین قیمتِ پایه).
 * نتیجه این بود که برای محصولات تخفیف‌دار، قیمتی که گوگل از داده‌ی
 * ساختاریافته می‌خواند با قیمتی که کاربر می‌دید یکی نبود. این ماژول یک
 * منبعِ واحد و خالص (بدون React/Next) برای هر دو مصرف‌کننده است.
 *
 * واحد پول: تمام ورودی/خروجی‌های این ماژول **تومان** هستند (همان واحدی که
 * در دیتابیس و API ذخیره می‌شود). تبدیل به ریال فقط در JSON-LD انجام می‌شود.
 */

/** کوچک‌ترین شکلِ یک variant که برای انتخاب و قیمت‌گذاری لازم است. */
export interface PricedVariant {
  price?: number | string | null;
  /** قیمتِ پس از تخفیف؛ فقط وقتی تخفیفِ فعالی وجود دارد مقدار می‌گیرد. */
  discountedPrice?: number | string | null;
  stock?: number | string | null;
  color?: { id?: number | null } | null;
  size?: { id?: number | null } | null;
  /** زمانِ انقضای تخفیفِ اعمال‌شده روی همین variant (ISO یا null). */
  discountExpiresAt?: string | Date | null;
}

export interface VariantSelection {
  colorId?: number | null;
  sizeId?: number | null;
}

/**
 * تبدیل امن به عددِ مثبت.
 *
 * مقادیرِ صفر، منفی، `NaN` و رشته‌های غیرعددی `null` برمی‌گردانند تا منتشر
 * نشوند (انتشارِ `price: 0` در JSON-LD نامعتبر است).
 */
export function toPositiveNumber(value: unknown): number | null {
  const numeric = Number(value);

  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

/**
 * variantی که دقیقاً با رنگ و سایزِ انتخاب‌شده مطابقت دارد.
 *
 * اگر رنگ یا سایز انتخاب نشده باشد، `undefined` برمی‌گردد (یعنی باید به
 * پیش‌فرض رفت، نه به اولین موردِ نیمه‌منطبق).
 */
export function findSelectedVariant<T extends PricedVariant>(
  variants: T[] | null | undefined,
  selection?: VariantSelection | null,
): T | undefined {
  const colorId = selection?.colorId;
  const sizeId = selection?.sizeId;

  if (typeof colorId !== 'number' || typeof sizeId !== 'number') {
    return undefined;
  }

  return (variants ?? []).find(
    variant =>
      variant?.color?.id === colorId && variant?.size?.id === sizeId,
  );
}

/**
 * variantی که صفحه نمایش می‌دهد:
 * variant انتخاب‌شده، وگرنه **اولین** variant (همان رفتارِ storefront).
 */
export function resolveDisplayVariant<T extends PricedVariant>(
  variants: T[] | null | undefined,
  selection?: VariantSelection | null,
): T | null {
  const selected = findSelectedVariant(variants, selection);

  if (selected) return selected;

  const first = (variants ?? [])[0];

  return first ?? null;
}

/** قیمتِ پایه‌ی variant (بدون تخفیف) اگر معتبر باشد. */
export function basePrice(variant?: PricedVariant | null): number | null {
  return toPositiveNumber(variant?.price);
}

/**
 * قیمت مؤثر = `discountedPrice ?? price`.
 *
 * اگر تخفیف نامعتبر (صفر/منفی/NaN) باشد، به قیمتِ پایه برمی‌گردیم.
 */
export function effectivePrice(variant?: PricedVariant | null): number | null {
  const discounted = toPositiveNumber(variant?.discountedPrice);

  if (discounted !== null) return discounted;

  return basePrice(variant);
}

/**
 * آیا قیمتِ نمایش‌داده‌شده واقعاً تخفیف‌دار است؟
 *
 * یعنی تخفیف معتبر است و از قیمتِ پایه کمتر است (تخفیفِ ۰٪ یا تخفیفی که
 * تصادفاً با قیمتِ پایه برابر است، «تخفیف» حساب نمی‌شود).
 */
export function isDiscounted(variant?: PricedVariant | null): boolean {
  const discounted = toPositiveNumber(variant?.discountedPrice);

  if (discounted === null) return false;

  const base = basePrice(variant);

  return base === null || discounted < base;
}

/**
 * زمانِ انقضای تخفیف برای `priceValidUntil`، یا `null`.
 *
 * فقط زمانی برگردانده می‌شود که:
 * - قیمتِ نمایش‌داده‌شده واقعاً تخفیف‌دار باشد (`isDiscounted`)؛
 * - مقدار به یک تاریخِ معتبر تبدیل شود؛
 * - آن تاریخ در آینده باشد (تاریخِ گذشته یعنی تخفیف دیگر معتبر نیست و
 *   منتشر کردنِ آن اشتباه است).
 */
export function discountExpiresAt(
  variant?: PricedVariant | null,
  now: number = Date.now(),
): string | null {
  if (!isDiscounted(variant)) return null;

  const raw = variant?.discountExpiresAt;

  if (raw === null || raw === undefined || raw === '') return null;

  const date = raw instanceof Date ? raw : new Date(raw);
  const time = date.getTime();

  if (!Number.isFinite(time)) return null;
  if (time <= now) return null;

  return date.toISOString();
}

/** آیا حداقل یک variant موجود دارد؟ (همان قاعده‌ی storefront: `stock > 0`) */
export function hasStock(
  variants: PricedVariant[] | null | undefined,
): boolean {
  return (variants ?? []).some(
    variant => toPositiveNumber(variant?.stock) !== null,
  );
}
