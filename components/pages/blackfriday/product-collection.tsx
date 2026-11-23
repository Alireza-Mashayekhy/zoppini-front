'use client';

import { useMemo, useState } from 'react';

import ProductCard from '@/components/shared/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BLACK_FRIDAY_API_SORT,
  BLACK_FRIDAY_CATEGORY_ID,
  BLACK_FRIDAY_PAGE_SIZE,
  blackFridayCategoryFilter,
  type BlackFridaySubcategory,
} from '@/lib/blackfriday/campaign';
import { productDiscountPercent, toProductCardData } from '@/lib/blackfriday/products';
import { useInfiniteProducts } from '@/lib/hooks/use-infinite-products';
import type { PaginationMeta } from '@/services/api/types';
import type { ProductsResponse } from '@/services/features/products/type';

import styles from './product-collection.module.css';

/**
 * بخش پنجم — همهٔ محصولات بلک فرایدی.
 *
 * - دادهٔ اولیه همان صفحهٔ اولی است که سرور برای رتبه‌بندی تخفیف‌ها خوانده
 *   است؛ ادامهٔ لیست با اسکرول بی‌نهایت از API واقعی می‌آید.
 * - فیلتر دسته‌بندی با شناسهٔ واقعی زیردسته‌ها انجام می‌شود؛ «همه» دامنهٔ
 *   کل کمپین (۱۳۷) است و زیردسته فقط خودش را می‌فرستد، چون بک‌اند شناسه‌ها
 *   را با زیردسته‌هایشان ادغام می‌کند. مرتب‌سازی همان مقادیر پشتیبانی‌شدهٔ
 *   API است.
 * - «بیشترین تخفیف» تنها گزینه‌ای است که API معادلش را ندارد و در کلاینت
 *   روی همان مجموعه رتبه‌بندی می‌شود.
 */
const SORTS = [
  { value: 'discount:desc', label: 'بیشترین تخفیف' },
  { value: 'sold:desc', label: 'محبوب‌ترین‌ها' },
  { value: 'createdAt:desc', label: 'جدیدترین‌ها' },
  { value: 'price:asc', label: 'ارزان‌ترین' },
  { value: 'price:desc', label: 'گران‌ترین' },
] as const;

type SortValue = (typeof SORTS)[number]['value'];

function ProductCardSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden border border-[#e8e6e3] bg-white"
      aria-hidden="true"
    >
      <Skeleton className="relative aspect-[4/5] w-full rounded-none" />
      <div className="flex shrink-0 flex-col gap-2 px-3 py-3 sm:px-4">
        <div className="flex min-h-5 items-start">
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}

type ProductCollectionProps = {
  initialItems: ProductsResponse[];
  initialPagination?: PaginationMeta | null;
  subcategories: BlackFridaySubcategory[];
  /** true یعنی خواندن اولیهٔ محصولات در سرور ناموفق بود */
  unavailable?: boolean;
};

export function ProductCollection({
  initialItems,
  initialPagination,
  subcategories,
  unavailable = false,
}: ProductCollectionProps) {
  const [sort, setSort] = useState<SortValue>('discount:desc');
  /** null یعنی «همه»؛ در غیر این صورت شناسهٔ زیردستهٔ انتخاب‌شده */
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const {
    items,
    loading,
    hasMore,
    failed,
    sentinelRef,
    loadMore,
    reload,
    updateQuery,
  } = useInfiniteProducts({
      initialItems,
      initialPagination,
      initialQuery: {
        categoryIds: [BLACK_FRIDAY_CATEGORY_ID],
        sort: BLACK_FRIDAY_API_SORT,
        limit: initialPagination?.limit || BLACK_FRIDAY_PAGE_SIZE,
      },
    });

  const shown = useMemo(() => {
    if (sort !== 'discount:desc') return items;

    return [...items].sort(
      (left, right) =>
        productDiscountPercent(right) - productDiscountPercent(left) ||
        right.id - left.id,
    );
  }, [items, sort]);

  const changeSort = (next: SortValue) => {
    setSort(next);
    // «بیشترین تخفیف» سمت کلاینت رتبه‌بندی می‌شود؛ به API همان ترتیب پایه
    // داده می‌شود تا صفحه‌بندی پایدار بماند.
    updateQuery({
      sort: next === 'discount:desc' ? BLACK_FRIDAY_API_SORT : next,
    });
  };

  const changeCategory = (next: number | null) => {
    setCategoryId(next);
    updateQuery({ categoryIds: blackFridayCategoryFilter(next) });
  };

  return (
    <section
      className={styles.section}
      id="collection"
      aria-labelledby="collection-heading"
    >
      <div className={styles.inner}>
        <header className={styles.intro}>
          <h2 id="collection-heading">تمام محصولات بلک‌فرایدی</h2>
          <p>مجموعه محصولات منتخب زوپینی با تخفیف‌های ویژه</p>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.filters} role="group" aria-label="فیلتر دسته‌بندی">
            <button
              type="button"
              className={categoryId === null ? styles.filterActive : styles.filter}
              aria-pressed={categoryId === null}
              onClick={() => changeCategory(null)}
            >
              همه
            </button>
            {subcategories.map(subcategory => (
              <button
                key={subcategory.id}
                type="button"
                className={
                  categoryId === subcategory.id
                    ? styles.filterActive
                    : styles.filter
                }
                aria-pressed={categoryId === subcategory.id}
                onClick={() => changeCategory(subcategory.id)}
              >
                {subcategory.name}
              </button>
            ))}
          </div>

          <label className={styles.sortLabel}>
            <span>مرتب‌سازی</span>
            <select
              aria-label="مرتب‌سازی محصولات"
              value={sort}
              onChange={event => changeSort(event.target.value as SortValue)}
            >
              {SORTS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {shown.length === 0 && !loading ? (
          <div className={styles.empty} role="status">
            <p>
              {failed || unavailable
                ? 'دریافت محصولات ناموفق بود. کمی بعد دوباره تلاش کنید.'
                : 'محصولی در این دسته نیست.'}
            </p>
            {(failed || unavailable) && (
              <button type="button" className={styles.more} onClick={reload}>
                تلاش دوباره
              </button>
            )}
          </div>
        ) : (
          <ul className={styles.grid} aria-busy={loading}>
            {shown.map(product => (
              <li key={product.id}>
                <ProductCard {...toProductCardData(product)} />
              </li>
            ))}
            {loading &&
              Array.from({ length: BLACK_FRIDAY_PAGE_SIZE }).map((_, index) => (
                <li key={`skeleton-${index}`}>
                  <ProductCardSkeleton />
                </li>
              ))}
          </ul>
        )}

        {/* نقطهٔ تریگر اسکرول بی‌نهایت؛ همان تنظیم‌های لیست محصولات فروشگاه */}
        <div ref={sentinelRef} aria-hidden="true" className={styles.sentinel} />

        {hasMore && !loading && (
          <button type="button" className={styles.more} onClick={loadMore}>
            محصولات بیشتر
          </button>
        )}

        {failed && shown.length > 0 && !loading && (
          <p className={styles.error} role="status">
            بارگذاری بخشی از محصولات ناموفق بود؛ با «محصولات بیشتر» دوباره
            تلاش کنید.
          </p>
        )}
      </div>
    </section>
  );
}
