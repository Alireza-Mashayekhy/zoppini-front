import type { ProductDiscount } from '@/services/features/discounts/types';
import type { ProductsResponse } from '@/services/features/products/type';

import { isBlackFridaySubcategoryId } from './campaign';

/**
 * نگاشت دادهٔ واقعی محصولات فروشگاه به داده‌ای که کارت محصول و بخش‌های
 * لندینگ لازم دارند.
 *
 * قاعده‌ها عیناً از منطق موجود فروشگاه گرفته شده‌اند:
 * - قیمت پایه و قیمت نهایی از پاسخ API (که خودش تخفیف‌ها را اعمال کرده)
 * - موجودی از `stock` واریانت‌ها (`stock > 0` یعنی قابل خرید)
 * - درصد تخفیف از `effectivePercent` و در نبودِ آن از قیمت‌های اصلی/نهایی
 */

/** تبدیل امن به عددِ متناهی؛ رشته‌های اعشاریِ API هم پشتیبانی می‌شوند. */
export function toFiniteNumber(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toPositiveNumber(value: unknown): number | null {
  const numeric = toFiniteNumber(value);
  return numeric !== null && numeric > 0 ? numeric : null;
}

/** آیا محصول دست‌کم یک واریانت موجود دارد؟ (همان قاعدهٔ فروشگاه) */
export function productInStock(product: ProductsResponse): boolean {
  return (product.variants ?? []).some(
    variant => toPositiveNumber(variant?.stock) !== null,
  );
}

/** قیمت پایهٔ نمایش‌داده‌شده؛ کم‌ترین قیمت واریانت‌ها اگر ممکن باشد. */
export function productBasePrice(product: ProductsResponse): number {
  const prices = (product.variants ?? [])
    .map(variant => toPositiveNumber(variant?.price))
    .filter((price): price is number => price !== null);

  if (prices.length) return Math.min(...prices);

  return toPositiveNumber(product.discount?.originalPrice) ?? 0;
}

/** قیمت نهایی پس از تخفیف؛ اگر تخفیف معتبری نباشد، قیمت پایه. */
export function productFinalPrice(product: ProductsResponse): number {
  const discount = product.discount;
  const base = productBasePrice(product);

  if (!discount) return base;

  const original = toPositiveNumber(discount.originalPrice) ?? base;
  const final = toPositiveNumber(discount.finalPrice);

  if (final !== null && final < original) return final;

  return base;
}

/** درصد تخفیفِ مؤثر؛ اولویت با مقدار معتبر `effectivePercent` سرور است. */
export function productDiscountPercent(product: ProductsResponse): number {
  const discount = product.discount;
  if (!discount) return 0;

  const reported = toFiniteNumber(discount.effectivePercent);
  if (reported !== null && reported > 0 && reported <= 100) {
    return Math.round(reported);
  }

  const original = toPositiveNumber(discount.originalPrice);
  const final = toPositiveNumber(discount.finalPrice);

  if (original === null || final === null || final >= original) return 0;

  return Math.round(((original - final) / original) * 100);
}

/**
 * آیا محصول واقعاً تخفیف دارد؟
 *
 * هم درصد مثبت لازم است و هم قیمت نهایی کمتر از قیمت پیش از تخفیف؛ با این
 * شرط هیچ محصولی فقط به‌خاطر یک عدد ناهماهنگ در بخش «بیشترین تخفیف‌ها»
 * نمی‌آید.
 */
export function productHasDiscount(product: ProductsResponse): boolean {
  if (productDiscountPercent(product) <= 0) return false;

  const discount = product.discount;
  if (!discount) return false;

  const original = toPositiveNumber(discount.originalPrice);
  const final = toPositiveNumber(discount.finalPrice);

  if (original === null || final === null || final >= original) return false;

  return true;
}

/** زیردستهٔ کمپین که این محصول در آن قرار دارد (برای تنوع و زیرنویس). */
export function productSubcategory(
  product: ProductsResponse,
): { id: number; name: string } | null {
  const categories = product.categories ?? [];
  const match = categories.find(category =>
    isBlackFridaySubcategoryId(Number(category?.id)),
  );

  if (!match) return null;

  return { id: Number(match.id), name: String(match.name ?? '') };
}

export type BlackFridayCardData = {
  id: number;
  image: string;
  title: string;
  subtitle?: string;
  price: number;
  slug: string;
  discount?: ProductDiscount;
  promotionBadge: ProductsResponse['promotionBadge'];
  extraDiscountBadge: ProductsResponse['extraDiscountBadge'];
};

/**
 * دادهٔ کارت محصول با همان شکلِ props کارت مشترک فروشگاه.
 *
 * قیمتِ خط‌خورده همان قیمت پایه‌ای است که سرور تخفیف را روی آن حساب کرده؛
 * بنابراین درصدِ روی کارت و عددِ خط‌خورده همیشه با هم می‌خوانند.
 */
export function toProductCardData(
  product: ProductsResponse,
): BlackFridayCardData {
  const subcategory = productSubcategory(product);
  const base = productBasePrice(product);
  const discount = product.discount;
  const price =
    discount && productHasDiscount(product)
      ? (toPositiveNumber(discount.originalPrice) ?? base)
      : base;

  return {
    id: product.id,
    image: product.image,
    title: product.title,
    ...(subcategory?.name ? { subtitle: subcategory.name } : {}),
    price,
    slug: product.slug,
    ...(discount ? { discount } : {}),
    promotionBadge: product.promotionBadge ?? null,
    extraDiscountBadge: product.extraDiscountBadge ?? null,
  };
}

/** حذف محصولات تکراری بر اساس شناسه، با حفظ ترتیب ورودی. */
export function mergeUniqueProducts(
  groups: ProductsResponse[][],
): ProductsResponse[] {
  const seen = new Set<number>();
  const merged: ProductsResponse[] = [];

  for (const group of groups) {
    for (const product of group) {
      if (!product || seen.has(product.id)) continue;
      seen.add(product.id);
      merged.push(product);
    }
  }

  return merged;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swapIndex];
    copy[swapIndex] = current;
  }
  return copy;
}

/**
 * انتخاب «بیشترین تخفیف‌ها» از کل محصولاتِ سالمِ دسته.
 *
 * همان الگوریتم نسخهٔ تأییدشدهٔ لندینگ است:
 *   ۱. فقط محصول موجود و دارای تخفیف واقعی وارد انتخاب می‌شود.
 *   ۲. کاندیدها بر اساس درصد تخفیف، نزولی مرتب می‌شوند.
 *   ۳. ابتدا از هر زیردسته حداکثر یک محصول برداشته می‌شود تا تنوع حفظ شود؛
 *      اگر تعداد کافی نبود، از بین بقیهٔ محصولات با بالاترین درصد تکمیل می‌شود.
 *   ۴. در هر «بازهٔ قابل‌مقایسه» (۱۰ درصدِ پایین‌تر از بیشترین تخفیف) ترتیب
 *      تصادفی است، پس با هر بار باز شدن تازه، انتخاب می‌تواند عوض شود.
 *
 * تابع خالص است؛ `random` را در سرور با `Math.random` و در تست با یک
 * مولدِ قطعی می‌دهیم.
 */
export function selectBiggestDiscounts<T extends ProductsResponse>(
  products: T[],
  count: number,
  random: () => number = Math.random,
): T[] {
  type Candidate = { product: T; percent: number; categoryKey: string };

  const candidates: Candidate[] = [];
  const seen = new Set<number>();

  for (const product of products) {
    if (!product || seen.has(product.id)) continue;
    seen.add(product.id);

    if (!productInStock(product) || !productHasDiscount(product)) continue;

    const subcategory = productSubcategory(product);
    candidates.push({
      product,
      percent: productDiscountPercent(product),
      categoryKey: subcategory ? `subcategory:${subcategory.id}` : 'other',
    });
  }

  if (!candidates.length || count <= 0) return [];

  const selected: Candidate[] = [];
  const usedIds = new Set<number>();
  const usedCategories = new Set<string>();
  const maxPercent = candidates.reduce(
    (max, candidate) => Math.max(max, candidate.percent),
    0,
  );
  const comparableFloor = maxPercent - 10;

  const take = (pool: Candidate[], allowRepeatCategory: boolean) => {
    const grouped = new Map<number, Candidate[]>();
    for (const candidate of pool) {
      const bucket = grouped.get(candidate.percent) ?? [];
      bucket.push(candidate);
      grouped.set(candidate.percent, bucket);
    }

    const percents = [...grouped.keys()].sort((left, right) => right - left);
    for (const percent of percents) {
      if (selected.length >= count) return;
      for (const candidate of shuffle(grouped.get(percent) ?? [], random)) {
        if (selected.length >= count) return;
        if (usedIds.has(candidate.product.id)) continue;
        if (
          !allowRepeatCategory &&
          usedCategories.has(candidate.categoryKey)
        ) {
          continue;
        }

        selected.push(candidate);
        usedIds.add(candidate.product.id);
        usedCategories.add(candidate.categoryKey);
      }
    }
  };

  const comparable = candidates.filter(
    candidate => candidate.percent >= comparableFloor,
  );
  const lower = candidates.filter(
    candidate => candidate.percent < comparableFloor,
  );

  take(comparable, false);
  take(comparable, true);
  take(lower, false);
  take(lower, true);

  // ترتیب نهایی همیشه نزولی بر اساس درصد است؛ انتخابِ مکمل (مرحلهٔ چهارم)
  // ممکن است درصدی بالاتر از آخرین انتخابِ مرحلهٔ قبل داشته باشد و بدون این
  // مرتب‌سازی، کارت ششم بالاتر از کارت پنجم دیده می‌شد.
  return [...selected]
    .sort((left, right) => right.percent - left.percent)
    .map(candidate => candidate.product);
}
