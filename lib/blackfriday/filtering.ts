import { sortSizeOptions } from '@/lib/product-size-order';
import type { CategoriesResponse } from '@/services/features/categories/types';
import type {
  ColorResponse,
  ProductsResponse,
  SizeResponse,
} from '@/services/features/products/type';

import {
  type CategoryIndex,
  isCategoryOrDescendant,
  productDiscountPercent,
  productFinalPrice,
  productRootCategoryIds,
} from './products';

/**
 * جستجو و فیلتر سمت کلاینتِ لیست بلک فرایدی.
 *
 * لیست واجد (دستهٔ بلک فرایدی + محصولات ۲۰٪) یک‌بار در سرور خوانده و
 * درهم‌تنیده می‌شود و همان مجموعه به کلاینت می‌رود؛ پس جستجو و فیلترها
 * روی همان مجموعه، بدون درخواست تازه و بدون ریلود صفحه، اعمال می‌شوند و
 * با هم ترکیب می‌شوند. همهٔ توابع اینجا خالص‌اند تا تست‌پذیر بمانند.
 */

export type BlackFridaySortValue =
  | 'balanced'
  | 'discount:desc'
  | 'createdAt:desc'
  | 'price:asc'
  | 'price:desc';

export type BlackFridayFilters = {
  /** متن جستجو روی نام محصول (فارسی) */
  search: string;
  /** شناسهٔ دستهٔ اصلی؛ null یعنی همه */
  mainCategoryId: number | null;
  /** شناسهٔ زیردسته؛ null یعنی همهٔ زیردسته‌های دستهٔ اصلی */
  subcategoryId: number | null;
  sizeIds: number[];
  colorIds: number[];
  /** قیمت نهایی (پس از تخفیف)؛ undefined یعنی بدون محدودیت */
  priceMin?: number;
  priceMax?: number;
};

export const EMPTY_BLACK_FRIDAY_FILTERS: BlackFridayFilters = {
  search: '',
  mainCategoryId: null,
  subcategoryId: null,
  sizeIds: [],
  colorIds: [],
  priceMin: undefined,
  priceMax: undefined,
};

/** آیا هیچ فیلتر/جستجویی فعال نیست؟ (برای دکمهٔ «پاک کردن همه») */
export function hasActiveBlackFridayFilters(
  filters: BlackFridayFilters,
): boolean {
  return Boolean(
    filters.search.trim() ||
      filters.mainCategoryId !== null ||
      filters.subcategoryId !== null ||
      filters.sizeIds.length ||
      filters.colorIds.length ||
      filters.priceMin !== undefined ||
      filters.priceMax !== undefined,
  );
}

/**
 * نرمال‌سازی متن برای جستجوی فارسی: حروف عربی/فارسی یکسان می‌شوند تا
 * «پیراهن» با «پيراهن» هم پیدا شود.
 */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

/** آیا نام محصول با عبارت جستجو می‌خواند؟ عبارت خالی همه را می‌خواند. */
export function productMatchesSearch(
  product: ProductsResponse,
  search: string,
): boolean {
  const term = normalizeSearchText(search);
  if (!term) return true;

  return normalizeSearchText(product.title ?? '').includes(term);
}

/** آیا محصول در دستهٔ اصلی انتخاب‌شده است؟ (با گسترش به زیردسته‌ها) */
function productMatchesMainCategory(
  product: ProductsResponse,
  mainCategoryId: number | null,
  index: CategoryIndex,
): boolean {
  if (mainCategoryId === null) return true;

  return productRootCategoryIds(product, index).includes(mainCategoryId);
}

/** آیا محصول در زیردستهٔ انتخاب‌شده (یا نوادگان آن) است؟ */
function productMatchesSubcategory(
  product: ProductsResponse,
  subcategoryId: number | null,
  index: CategoryIndex,
): boolean {
  if (subcategoryId === null) return true;

  return (product.categories ?? []).some(category => {
    const id = Number(category?.id);
    return (
      Number.isFinite(id) && isCategoryOrDescendant(id, subcategoryId, index)
    );
  });
}

/** آیا محصول واریانتی با یکی از سایزهای انتخاب‌شده دارد؟ */
function productMatchesSizes(
  product: ProductsResponse,
  sizeIds: number[],
): boolean {
  if (!sizeIds.length) return true;
  const selected = new Set(sizeIds);

  return (product.variants ?? []).some(variant =>
    selected.has(Number(variant?.sizeId)),
  );
}

/** آیا محصول واریانتی با یکی از رنگ‌های انتخاب‌شده دارد؟ */
function productMatchesColors(
  product: ProductsResponse,
  colorIds: number[],
): boolean {
  if (!colorIds.length) return true;
  const selected = new Set(colorIds);

  return (product.variants ?? []).some(variant =>
    selected.has(Number(variant?.colorId)),
  );
}

/** آیا قیمت نهایی محصول در بازهٔ انتخاب‌شده است؟ */
function productMatchesPrice(
  product: ProductsResponse,
  priceMin?: number,
  priceMax?: number,
): boolean {
  if (priceMin === undefined && priceMax === undefined) return true;

  const price = productFinalPrice(product);
  if (priceMin !== undefined && price < priceMin) return false;
  if (priceMax !== undefined && price > priceMax) return false;
  return true;
}

/**
 * اعمال همهٔ فیلترها و جستجو روی مجموعهٔ واجد.
 *
 * ترتیب ورودی حفظ می‌شود (ترتیب متوازن سرور)؛ مرتب‌سازی جداگانه انجام
 * می‌شود تا «ترکیب پیشنهادی» پیش‌فرض دست‌نخورده بماند.
 */
export function filterBlackFridayProducts<T extends ProductsResponse>(
  products: T[],
  filters: BlackFridayFilters,
  index: CategoryIndex,
): T[] {
  return products.filter(
    product =>
      productMatchesSearch(product, filters.search) &&
      productMatchesMainCategory(product, filters.mainCategoryId, index) &&
      productMatchesSubcategory(product, filters.subcategoryId, index) &&
      productMatchesSizes(product, filters.sizeIds) &&
      productMatchesColors(product, filters.colorIds) &&
      productMatchesPrice(product, filters.priceMin, filters.priceMax),
  );
}

/**
 * مرتب‌سازی لیست پس از فیلتر.
 *
 * - `balanced`: همان ترتیب متوازن سرور (پیش‌فرض).
 * - بقیه همان گزینه‌های موجود فروشگاه‌اند و سمت کلاینت روی همان مجموعه
 *   محاسبه می‌شوند؛ قیمت، قیمت نهایی پس از تخفیف است.
 */
export function sortBlackFridayProducts<T extends ProductsResponse>(
  products: T[],
  sort: BlackFridaySortValue,
): T[] {
  if (sort === 'balanced') return products;

  const sorted = [...products];

  switch (sort) {
    case 'discount:desc':
      sorted.sort(
        (left, right) =>
          productDiscountPercent(right) - productDiscountPercent(left) ||
          right.id - left.id,
      );
      break;
    case 'createdAt:desc':
      sorted.sort(
        (left, right) =>
          Date.parse(right.createdAt) - Date.parse(left.createdAt) ||
          right.id - left.id,
      );
      break;
    case 'price:asc':
      sorted.sort(
        (left, right) =>
          productFinalPrice(left) - productFinalPrice(right) ||
          left.id - right.id,
      );
      break;
    case 'price:desc':
      sorted.sort(
        (left, right) =>
          productFinalPrice(right) - productFinalPrice(left) ||
          right.id - left.id,
      );
      break;
    default:
      break;
  }

  return sorted;
}

export type BlackFridayFilterOptions = {
  /** دسته‌های اصلی‌ای که در محصولات واجد واقعاً وجود دارند */
  mainCategories: { id: number; name: string }[];
  /** زیردسته‌های هر دستهٔ اصلی (فقط آن‌هایی که محصول واجد دارند) */
  subcategoriesByMain: Map<number, { id: number; name: string }[]>;
  /** همهٔ زیردسته‌های دارای محصول واجد (برای حالت «بدون دستهٔ اصلی») */
  allSubcategories: { id: number; name: string; mainId: number }[];
  sizes: SizeResponse[];
  colors: ColorResponse[];
  /** کمترین/بیشترین قیمت نهایی در محصولات واجد */
  minPrice: number;
  maxPrice: number;
};

/**
 * ساخت گزینه‌های فیلتر از خودِ محصولات واجد و واریانت‌هایشان.
 *
 * دسته‌ها از درخت واقعی فروشگاه (`parentId`) خوانده می‌شوند و فقط آن‌هایی
 * که محصول واجد دارند نمایش داده می‌شوند؛ سایز/رنگ هم فقط از واریانت‌های
 * همین محصولات می‌آیند، نه از لیست سراسری سیستم.
 */
export function deriveBlackFridayFilterOptions(
  products: ProductsResponse[],
  index: CategoryIndex,
): BlackFridayFilterOptions {
  const mainIds = new Set<number>();
  const subByMain = new Map<number, Map<number, string>>();
  const sizeById = new Map<number, SizeResponse>();
  const colorById = new Map<number, ColorResponse>();

  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = 0;

  for (const product of products) {
    const roots = productRootCategoryIds(product, index);
    for (const root of roots) mainIds.add(root);

    for (const category of product.categories ?? []) {
      const id = Number(category?.id);
      if (!Number.isFinite(id)) continue;

      const root = roots.find(candidate =>
        isCategoryOrDescendant(id, candidate, index),
      );
      if (root === undefined) continue;

      const subs = subByMain.get(root) ?? new Map<number, string>();
      if (!subs.has(id)) subs.set(id, String(category?.name ?? ''));
      subByMain.set(root, subs);
    }

    for (const variant of product.variants ?? []) {
      const sizeId = Number(variant?.sizeId);
      const colorId = Number(variant?.colorId);

      if (
        Number.isFinite(sizeId) &&
        variant?.size &&
        !sizeById.has(sizeId)
      ) {
        sizeById.set(sizeId, {
          id: sizeId,
          name: String(variant.size.name ?? ''),
        });
      }

      if (
        Number.isFinite(colorId) &&
        variant?.color &&
        !colorById.has(colorId)
      ) {
        colorById.set(colorId, {
          id: colorId,
          name: String(variant.color.name ?? ''),
          hexCode: String(variant.color.hexCode ?? ''),
        });
      }
    }

    const price = productFinalPrice(product);
    if (price < minPrice) minPrice = price;
    if (price > maxPrice) maxPrice = price;
  }

  const mainCategories = [...mainIds]
    .map(id => ({ id, name: index.get(id)?.name ?? '' }))
    .filter(item => item.name)
    .sort((left, right) => left.id - right.id);

  const subcategoriesByMain = new Map<
    number,
    { id: number; name: string }[]
  >();
  const allSubcategories: { id: number; name: string; mainId: number }[] = [];

  for (const [mainId, subs] of subByMain) {
    const list = [...subs.entries()]
      .map(([id, name]) => ({ id, name }))
      .filter(item => item.name)
      .sort((left, right) => left.id - right.id);

    subcategoriesByMain.set(mainId, list);
    for (const sub of list) allSubcategories.push({ ...sub, mainId });
  }

  allSubcategories.sort((left, right) => left.id - right.id);

  return {
    mainCategories,
    subcategoriesByMain,
    allSubcategories,
    sizes: sortSizeOptions([...sizeById.values()]),
    colors: [...colorById.values()].sort((left, right) =>
      left.name.localeCompare(right.name, 'fa'),
    ),
    minPrice: Number.isFinite(minPrice) ? minPrice : 0,
    maxPrice,
  };
}

/** دسته‌بندی‌های لازم برای درخت (فقط آن‌هایی که محصول واجد دارد + والدها). */
export function pruneCategoriesForProducts(
  products: ProductsResponse[],
  categories: CategoriesResponse[] | null | undefined,
): CategoriesResponse[] {
  const all = categories ?? [];
  const byId = new Map(all.map(category => [category.id, category]));
  const needed = new Set<number>();

  const addWithAncestors = (id: number) => {
    let current = byId.get(id);
    const seen = new Set<number>();

    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      needed.add(current.id);
      if (current.parentId == null) break;
      current = byId.get(Number(current.parentId));
    }
  };

  for (const product of products) {
    for (const category of product.categories ?? []) {
      const id = Number(category?.id);
      if (Number.isFinite(id)) addWithAncestors(id);
    }
  }

  return all.filter(category => needed.has(category.id));
}
