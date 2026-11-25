import type { CategoriesResponse } from '@/services/features/categories/types';
import type { ProductDiscount } from '@/services/features/discounts/types';
import type { ProductsResponse } from '@/services/features/products/type';

import {
  BLACK_FRIDAY_CATEGORY_ID,
  isBlackFridaySubcategoryId,
  STANDARD_DISCOUNT_PERCENT,
} from './campaign';

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

/**
 * آیا محصول خارج از دستهٔ بلک فرایدی، تخفیف فعالِ استاندارد (۲۰٪) دارد؟
 *
 * واجدیت گروه ۲۰٪ دقیقاً همین است: تخفیف واقعی (`productHasDiscount`) و
 * درصد مؤثر برابر ۲۰. محصولات با درصدهای دیگر در لیست بلک فرایدی
 * نمی‌آیند.
 */
export function isTwentyPercentProduct(product: ProductsResponse): boolean {
  return (
    productHasDiscount(product) &&
    productDiscountPercent(product) === STANDARD_DISCOUNT_PERCENT
  );
}

/**
 * فهرست دسته‌بندی‌ها برای پیمایش درخت (شناسه → دسته).
 *
 * درخت با `parentId` ساخته می‌شود؛ دستهٔ ریشه (`parentId` خالی یا ناموجود
 * در فهرست) همان «دستهٔ اصلی» فروشگاه است.
 */
export type CategoryIndex = Map<number, CategoriesResponse>;

export function buildCategoryIndex(
  categories: CategoriesResponse[] | null | undefined,
): CategoryIndex {
  return new Map((categories ?? []).map(category => [category.id, category]));
}

/**
 * شناسهٔ دستهٔ اصلی (ریشه) یک دسته، با پیمایش والدها.
 *
 * اگر والد در فهرست نباشد (مثلاً فهرست بریده شده باشد) همان دستهٔ جاری
 * ریشه حساب می‌شود تا پیمایش متوقف شود. حلقهٔ والد هم با مجموعهٔ دیده‌شده
 * مهار می‌شود.
 */
export function rootCategoryId(
  categoryId: number,
  index: CategoryIndex,
): number {
  const seen = new Set<number>();
  let current = index.get(categoryId);

  if (!current) return categoryId;

  while (
    current.parentId != null &&
    Number(current.parentId) !== current.id &&
    !seen.has(current.id)
  ) {
    seen.add(current.id);
    const parent = index.get(Number(current.parentId));
    if (!parent) break;
    current = parent;
  }

  return current.id;
}

/**
 * آیا `categoryId` همان دستهٔ موردنظر است یا یکی از نوادگان (descendant) آن؟
 *
 * معادل سمت کلاینتِ گسترش بک‌اند روی `categoryIds`: انتخاب یک دسته، محصولات
 * زیردسته‌هایش را هم در بر می‌گیرد.
 */
export function isCategoryOrDescendant(
  categoryId: number,
  ancestorId: number,
  index: CategoryIndex,
): boolean {
  if (categoryId === ancestorId) return true;

  const seen = new Set<number>();
  let current = index.get(categoryId);

  while (current && current.parentId != null && !seen.has(current.id)) {
    seen.add(current.id);
    const parentId = Number(current.parentId);
    if (parentId === ancestorId) return true;
    current = index.get(parentId);
  }

  return false;
}

/** شناسه‌های دسته‌های اصلی‌ای که این محصول در آن‌ها قرار دارد. */
export function productRootCategoryIds(
  product: ProductsResponse,
  index: CategoryIndex,
): number[] {
  const roots = new Set<number>();

  for (const category of product.categories ?? []) {
    const id = Number(category?.id);
    if (!Number.isFinite(id)) continue;
    roots.add(rootCategoryId(id, index));
  }

  return [...roots];
}

/**
 * دستهٔ اصلیِ «اولیهٔ» محصول برای تنوع‌بخشی در ترتیب.
 *
 * اگر محصول هم در دستهٔ بلک فرایدی و هم در یک دستهٔ اصلی فروشگاه باشد،
 * دستهٔ فروشگاهی اولویت دارد تا در چیدمان بین دسته‌های اصلی پخش شود؛ در
 * غیر این صورت ریشهٔ بلک فرایدی (۱۳۷) و در نبود آن، نخستین دستهٔ مستقیم
 * محصول ملاک است.
 */
export function productPrimaryRootId(
  product: ProductsResponse,
  index: CategoryIndex,
): number | null {
  const roots = productRootCategoryIds(product, index);
  if (!roots.length) return null;

  const storeRoot = roots.find(root => root !== BLACK_FRIDAY_CATEGORY_ID);
  return storeRoot ?? roots[0];
}

/** شناسهٔ نخستین دستهٔ مستقیم محصول (برای تنوع درون دستهٔ اصلی). */
function productDirectCategoryId(product: ProductsResponse): number | null {
  const first = (product.categories ?? [])[0];
  const id = Number(first?.id);
  return Number.isFinite(id) ? id : null;
}

/**
 * مرتب‌سازی تنوع‌بخش درون یک گروه: چرخش بین دسته‌های اصلی و درون هر دستهٔ
 * اصلی، چرخش بین زیردسته‌ها.
 *
 * قطعی است (بدون تصادفی) تا HTML سرور و hydration کلاینت یکی بماند؛ ترتیب
 * ورودی در هر دسته حفظ می‌شود و فقط بین دسته‌ها چرخش انجام می‌شود، پس
 * چند محصولِ تقریباً یکسانِ یک دسته کنار هم نمی‌آیند مگر آنکه دسته‌های
 * دیگر تمام شده باشند.
 */
function orderByCategoryVariety<T extends ProductsResponse>(
  products: T[],
  index: CategoryIndex,
): T[] {
  // ۱. افراز بر اساس دستهٔ اصلی، با حفظ ترتیب اولین ظهور
  const byRoot = new Map<number | null, T[]>();
  for (const product of products) {
    const root = productPrimaryRootId(product, index);
    const bucket = byRoot.get(root) ?? [];
    bucket.push(product);
    byRoot.set(root, bucket);
  }

  // ۲. درون هر دستهٔ اصلی: چرخش بین زیردسته‌ها
  const orderedRoots = [...byRoot.entries()].map(([root, bucket]) => {
    const byDirect = new Map<number | null, T[]>();
    for (const product of bucket) {
      const direct = productDirectCategoryId(product);
      const directBucket = byDirect.get(direct) ?? [];
      directBucket.push(product);
      byDirect.set(direct, directBucket);
    }

    const ordered: T[] = [];
    const directBuckets = [...byDirect.values()];
    let remaining = bucket.length;
    let cursor = 0;

    while (remaining > 0) {
      for (const directBucket of directBuckets) {
        if (cursor < directBucket.length) {
          ordered.push(directBucket[cursor]);
          remaining -= 1;
        }
      }
      cursor += 1;
    }

    return { root, ordered };
  });

  // ۳. چرخش بین دسته‌های اصلی
  const result: T[] = [];
  let remaining = products.length;
  let cursor = 0;

  while (remaining > 0) {
    for (const { ordered } of orderedRoots) {
      if (cursor < ordered.length) {
        result.push(ordered[cursor]);
        remaining -= 1;
      }
    }
    cursor += 1;
  }

  return result;
}

/**
 * درهم‌تنیدگی متوازن دو گروه تخفیف برای لیست بلک فرایدی.
 *
 * - گروه ۷۰٪: محصولات دستهٔ «زوپینی بلک فرایدی» (`blackFridayIds`).
 * - گروه ۲۰٪: بقیهٔ محصولات واجد (تخفیف فعال ۲۰٪).
 *
 * خروجی به‌صورت ۷۰، ۲۰، ۷۰، ۲۰… چیده می‌شود؛ پس در چیدمان چهارستونه، هر
 * یک از دو ردیف اول دقیقاً دو محصول ۷۰٪ و دو محصول ۲۰٪ دارد. وقتی یک
 * گروه تمام شود، بقیهٔ گروه دیگر پشت سر هم می‌آید. درون هر گروه هم تنوع
 * دسته‌بندی رعایت می‌شود. هیچ محصولی تکرار نمی‌شود و ترتیب قطعی است.
 */
export function interleaveBalancedProducts<T extends ProductsResponse>(
  products: T[],
  blackFridayIds: Set<number>,
  index: CategoryIndex,
): T[] {
  const group70: T[] = [];
  const group20: T[] = [];

  for (const product of products) {
    if (blackFridayIds.has(product.id)) group70.push(product);
    else group20.push(product);
  }

  const ordered70 = orderByCategoryVariety(group70, index);
  const ordered20 = orderByCategoryVariety(group20, index);

  const result: T[] = [];
  let i = 0;
  let j = 0;

  while (i < ordered70.length || j < ordered20.length) {
    if (i < ordered70.length) {
      result.push(ordered70[i]);
      i += 1;
    }
    if (j < ordered20.length) {
      result.push(ordered20[j]);
      j += 1;
    }
  }

  return result;
}
