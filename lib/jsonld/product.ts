import { mediaUrl } from '@/lib/media';
import {
  discountExpiresAt,
  effectivePrice,
  hasStock,
  PricedVariant,
  resolveDisplayVariant,
  VariantSelection,
} from '@/lib/product-price';

/**
 * ساخت داده‌ی ساختاریافته‌ی (JSON-LD) محصول.
 *
 * این ماژول عمداً خالص (بدون React/Next) است تا بشود روی آن تست نوشت.
 */

/** آدرس پایه‌ی canonical سایت — فقط non-www و فقط https. */
const SITE_URL = 'https://zoppinico.com';

/**
 * واحدِ ذخیره‌سازی قیمت در پایگاه داده: **تومان**.
 *
 * شواهد (همگی در مخزنِ فعلی):
 * - `back/src/payment/services/digipay-payment.service.ts` →
 *   `toGatewayAmount(amountInToman)` مقدار را در ۱۰ ضرب می‌کند تا به ریال
 *   (واحدِ درگاه) برساند؛
 * - `back/src/payment/services/mellat-payment.service.ts` →
 *   `Math.round((Number(order.finalPrice) - externalPayment) * 10)`؛
 * - `front/components/pages/product/content.tsx` مقدارِ خامِ دیتابیس را با
 *   برچسب «تومان» نمایش می‌دهد؛
 * - نمونه‌ی واقعی: محصول `mens-classic-trousers-zoppini0040465` در API مقدار
 *   `"12800000.00"` دارد و در صفحه «۱۲٬۸۰۰٬۰۰۰ تومان» نمایش داده می‌شود.
 */
export const RIALS_PER_TOMAN = 10;

/**
 * کد ISO 4217 برای ایران: `IRR` (ریال ایران).
 *
 * تومان کد رسمی در ISO 4217 ندارد؛ بنابراین عددِ تومانی را به ریال تبدیل
 * می‌کنیم تا مقدار و واحد با هم بخوانند.
 */
export const PRODUCT_PRICE_CURRENCY = 'IRR';

/** شکلِ variant در ورودیِ JSON-LD (همان قراردادِ `lib/product-price`). */
export type ProductJsonLdVariant = PricedVariant;

export interface ProductJsonLdInput {
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  image?: string | null;
  productCode?: string | number | null;
  variants?: ProductJsonLdVariant[] | null;
  /**
   * رنگ/سایزی که کاربر انتخاب کرده است.
   *
   * JSON-LD در HTMLِ اولیه‌ی سرور منتشر می‌شود، بنابراین معمولاً انتخابی
   * وجود ندارد و همان پیش‌فرضِ storefront (اولین variant) استفاده می‌شود؛
   * این پارامتر فقط برای جلوگیری از واگراییِ آینده نگه داشته شده است.
   */
  selection?: VariantSelection | null;
}

/** آدرس مطلق و ایمن برای یک مسیر/آدرسِ محصول. */
function toAbsoluteUrl(pathOrUrl: string): string | null {
  try {
    return new URL(pathOrUrl, SITE_URL).toString();
  } catch {
    return null;
  }
}

/** آدرس مطلقِ تصویر با استفاده از ابزار مرکزیِ مدیا. */
function toAbsoluteImageUrl(path?: string | null): string | null {
  if (!path) return null;

  const resolved = mediaUrl(path);

  if (!resolved) return null;

  return toAbsoluteUrl(resolved);
}

/**
 * ساختار JSON-LD محصول یا `null` اگر داده برای انتشار کافی نباشد.
 *
 * نکته‌های مهم:
 * - از **`Offer`** استفاده می‌شود (نه `AggregateOffer`) چون صفحه فقط یک قیمتِ
 *   مؤثر نمایش می‌دهد، نه یک بازه؛
 * - قیمت همان قیمتی است که کاربر می‌بیند:
 *   `discountedPrice ?? price` روی همان variantی که storefront نمایش می‌دهد؛
 * - اگر قیمت معتبری نداشته باشیم کلِ `offers` حذف می‌شود؛
 * - `priceValidUntil` فقط وقتی منتشر می‌شود که قیمت واقعاً تخفیف‌دار باشد و
 *   تاریخِ انقضای معتبری (در آینده) داشته باشیم؛
 * - تصویر/توضیحات/SKU فقط در صورت وجود منتشر می‌شوند.
 */
export function buildProductJsonLd(
  product?: ProductJsonLdInput | null,
): Record<string, unknown> | null {
  if (!product?.title || !product.slug) return null;

  const url = toAbsoluteUrl(`/product/${product.slug}`);
  if (!url) return null;

  const variants = product.variants ?? [];

  // همان قاعده‌ی storefront: variant انتخاب‌شده، وگرنه اولین variant.
  const displayVariant = resolveDisplayVariant(variants, product.selection);

  const priceInToman = effectivePrice(displayVariant);
  const priceValidUntil = discountExpiresAt(displayVariant);

  const description = (product.description ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);

  const image = toAbsoluteImageUrl(product.image);
  const sku = product.productCode ? String(product.productCode) : null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    ...(image ? { image } : {}),
    ...(description ? { description } : {}),
    ...(sku ? { sku } : {}),
    brand: { '@type': 'Brand', name: 'زوپینی' },
    ...(priceInToman
      ? {
          offers: {
            '@type': 'Offer',
            url,
            priceCurrency: PRODUCT_PRICE_CURRENCY,
            // دیتابیس تومان است و کدِ ISO ریال؛ تبدیلِ واحد اینجا انجام می‌شود.
            price: Math.round(priceInToman * RIALS_PER_TOMAN),
            availability: hasStock(variants)
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            ...(priceValidUntil ? { priceValidUntil } : {}),
          },
        }
      : {}),
  };
}
