'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import ProductCard from '@/components/shared/product-card';
import { BLACK_FRIDAY_PAGE_SIZE } from '@/lib/blackfriday/campaign';
import {
  type BlackFridayFilters,
  type BlackFridaySortValue,
  deriveBlackFridayFilterOptions,
  EMPTY_BLACK_FRIDAY_FILTERS,
  filterBlackFridayProducts,
  hasActiveBlackFridayFilters,
  sortBlackFridayProducts,
} from '@/lib/blackfriday/filtering';
import {
  buildCategoryIndex,
  toProductCardData,
} from '@/lib/blackfriday/products';
import type { CategoriesResponse } from '@/services/features/categories/types';
import type { ProductsResponse } from '@/services/features/products/type';

import styles from './product-collection.module.css';

/**
 * بخش پنجم — همهٔ محصولات بلک فرایدی (۷۰٪ + ۲۰٪).
 *
 * مجموعهٔ واجد در سرور خوانده و به‌صورت متوازن درهم‌تنیده شده است
 * (دو محصول ۷۰٪ و دو محصول ۲۰٪ در هر یک از دو ردیف اول) و همان مجموعه به
 * اینجا می‌رسد؛ پس جستجو و فیلترهای دسته/سایز/رنگ/قیمت روی همان مجموعه،
 * بدون درخواست تازه و بدون ریلود صفحه، اعمال می‌شوند و با هم ترکیب
 * می‌شوند. تغییر هر فیلتر یا مرتب‌سازی، بقیه را پاک نمی‌کند.
 *
 * مرتب‌سازی پیش‌فرض «ترکیب پیشنهادی» همان ترتیب متوازن سرور است؛ بقیهٔ
 * گزینه‌ها روی همان مجموعهٔ فیلترشده محاسبه می‌شوند.
 */
const SORTS: { value: BlackFridaySortValue; label: string }[] = [
  { value: 'balanced', label: 'ترکیب پیشنهادی' },
  { value: 'discount:desc', label: 'بیشترین تخفیف' },
  { value: 'createdAt:desc', label: 'جدیدترین‌ها' },
  { value: 'price:asc', label: 'ارزان‌ترین' },
  { value: 'price:desc', label: 'گران‌ترین' },
];

type ProductCollectionProps = {
  /** همهٔ محصولات واجد، به ترتیب متوازن سرور */
  products: ProductsResponse[];
  /** دسته‌بندی‌های لازم برای درخت (فقط آن‌هایی که محصول واجد دارد) */
  categories: CategoriesResponse[];
  /** true یعنی خواندن محصولات در سرور ناموفق بوده است */
  unavailable?: boolean;
};

const formatToman = (value: number) =>
  Math.max(0, Math.round(value)).toLocaleString('fa-IR');

export function ProductCollection({
  products,
  categories,
  unavailable = false,
}: ProductCollectionProps) {
  const router = useRouter();

  const [filters, setFilters] = useState<BlackFridayFilters>(
    EMPTY_BLACK_FRIDAY_FILTERS,
  );
  const [sort, setSort] = useState<BlackFridaySortValue>('balanced');
  const [visibleCount, setVisibleCount] = useState(BLACK_FRIDAY_PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const categoryIndex = useMemo(
    () => buildCategoryIndex(categories),
    [categories],
  );

  const options = useMemo(
    () => deriveBlackFridayFilterOptions(products, categoryIndex),
    [products, categoryIndex],
  );

  const filtered = useMemo(
    () => filterBlackFridayProducts(products, filters, categoryIndex),
    [products, filters, categoryIndex],
  );

  const sorted = useMemo(
    () => sortBlackFridayProducts(filtered, sort),
    [filtered, sort],
  );

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;
  const hasActiveFilters = hasActiveBlackFridayFilters(filters);
  const activeFilterCount =
    (filters.mainCategoryId !== null ? 1 : 0) +
    (filters.subcategoryId !== null ? 1 : 0) +
    filters.sizeIds.length +
    filters.colorIds.length +
    (filters.priceMin !== undefined || filters.priceMax !== undefined
      ? 1
      : 0);

  // با هر تغییر فیلتر/جستجو/مرتب‌سازی، نمایش از اول شروع می‌شود
  const resetVisible = () => setVisibleCount(BLACK_FRIDAY_PAGE_SIZE);

  const updateFilters = (next: Partial<BlackFridayFilters>) => {
    setFilters(previous => ({ ...previous, ...next }));
    resetVisible();
  };

  const changeSearch = (value: string) => {
    updateFilters({ search: value });
  };

  const changeMainCategory = (value: string) => {
    const mainCategoryId = value ? Number(value) : null;
    // زیردستهٔ قبلی ممکن است زیر دستهٔ اصلی تازه نباشد؛ ریست می‌شود
    updateFilters({ mainCategoryId, subcategoryId: null });
  };

  const changeSubcategory = (value: string) => {
    updateFilters({ subcategoryId: value ? Number(value) : null });
  };

  const toggleSize = (id: number) => {
    updateFilters({
      sizeIds: filters.sizeIds.includes(id)
        ? filters.sizeIds.filter(sizeId => sizeId !== id)
        : [...filters.sizeIds, id],
    });
  };

  const toggleColor = (id: number) => {
    updateFilters({
      colorIds: filters.colorIds.includes(id)
        ? filters.colorIds.filter(colorId => colorId !== id)
        : [...filters.colorIds, id],
    });
  };

  const changePrice = (key: 'priceMin' | 'priceMax', value: string) => {
    const trimmed = value.trim();
    const parsed = trimmed ? Number(trimmed) : undefined;
    updateFilters({
      [key]: parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined,
    });
  };

  const clearAll = () => {
    setFilters(EMPTY_BLACK_FRIDAY_FILTERS);
    resetVisible();
  };

  const changeSort = (next: BlackFridaySortValue) => {
    setSort(next);
    resetVisible();
  };

  // اسکرول بی‌نهایت روی همان مجموعهٔ فیلترشده (بدون درخواست شبکه)
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount(previous =>
            Math.min(previous + BLACK_FRIDAY_PAGE_SIZE, sorted.length),
          );
        }
      },
      { threshold: 0, rootMargin: '0px 0px 1000px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, sorted.length]);

  const subcategoryOptions =
    filters.mainCategoryId !== null
      ? (options.subcategoriesByMain.get(filters.mainCategoryId) ?? []).map(
          sub => ({ ...sub, mainName: '' }),
        )
      : options.allSubcategories.map(sub => ({
          id: sub.id,
          name: sub.name,
          mainName:
            options.mainCategories.find(main => main.id === sub.mainId)
              ?.name ?? '',
        }));

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
          <div className={styles.searchWrap}>
            <label className={styles.srOnly} htmlFor="bf-search">
              جستجو در محصولات
            </label>
            <input
              id="bf-search"
              type="search"
              value={filters.search}
              onChange={event => changeSearch(event.target.value)}
              placeholder="جستجو در محصولات…"
              className={styles.searchInput}
              autoComplete="off"
            />
            {filters.search && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => changeSearch('')}
                aria-label="پاک کردن جستجو"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            className={styles.filterToggle}
            aria-expanded={filtersOpen}
            aria-controls="bf-filters"
            onClick={() => setFiltersOpen(previous => !previous)}
          >
            فیلترها
            {activeFilterCount > 0 && (
              <span className={styles.filterBadge}>
                {activeFilterCount.toLocaleString('fa-IR')}
              </span>
            )}
          </button>

          <label className={styles.sortLabel}>
            <span>مرتب‌سازی</span>
            <select
              aria-label="مرتب‌سازی محصولات"
              value={sort}
              onChange={event =>
                changeSort(event.target.value as BlackFridaySortValue)
              }
            >
              {SORTS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          id="bf-filters"
          className={`${styles.panel} ${filtersOpen ? styles.panelOpen : ''}`}
        >
          <div className={styles.panelRow}>
            <label className={styles.field}>
              <span>دسته‌بندی اصلی</span>
              <select
                aria-label="دسته‌بندی اصلی"
                value={filters.mainCategoryId ?? ''}
                onChange={event => changeMainCategory(event.target.value)}
              >
                <option value="">همه دسته‌ها</option>
                {options.mainCategories.map(main => (
                  <option key={main.id} value={main.id}>
                    {main.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>زیردسته</span>
              <select
                aria-label="زیردسته"
                value={filters.subcategoryId ?? ''}
                onChange={event => changeSubcategory(event.target.value)}
              >
                <option value="">همه زیردسته‌ها</option>
                {subcategoryOptions.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.mainName ? `${sub.mainName} / ${sub.name}` : sub.name}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.field}>
              <span>محدوده قیمت (تومان)</span>
              <div className={styles.priceRow}>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder={formatToman(options.minPrice)}
                  value={filters.priceMin ?? ''}
                  onChange={event =>
                    changePrice('priceMin', event.target.value)
                  }
                  aria-label="حداقل قیمت"
                />
                <span aria-hidden="true">تا</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder={formatToman(options.maxPrice)}
                  value={filters.priceMax ?? ''}
                  onChange={event =>
                    changePrice('priceMax', event.target.value)
                  }
                  aria-label="حداکثر قیمت"
                />
              </div>
            </div>
          </div>

          {options.sizes.length > 0 && (
            <div className={styles.panelRow}>
              <span className={styles.groupLabel}>سایز</span>
              <div className={styles.chips}>
                {options.sizes.map(size => {
                  const active = filters.sizeIds.includes(size.id);
                  return (
                    <button
                      key={size.id}
                      type="button"
                      className={active ? styles.chipActive : styles.chip}
                      aria-pressed={active}
                      onClick={() => toggleSize(size.id)}
                    >
                      {size.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {options.colors.length > 0 && (
            <div className={styles.panelRow}>
              <span className={styles.groupLabel}>رنگ</span>
              <div className={styles.chips}>
                {options.colors.map(color => {
                  const active = filters.colorIds.includes(color.id);
                  return (
                    <button
                      key={color.id}
                      type="button"
                      className={active ? styles.chipActive : styles.chip}
                      aria-pressed={active}
                      onClick={() => toggleColor(color.id)}
                    >
                      <span
                        aria-hidden="true"
                        className={styles.swatch}
                        style={{ backgroundColor: color.hexCode }}
                      />
                      {color.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div className={styles.panelActions}>
              <button
                type="button"
                className={styles.clearAll}
                onClick={clearAll}
              >
                پاک کردن جستجو و همه فیلترها
              </button>
            </div>
          )}
        </div>

        <p className={styles.resultCount} role="status">
          {sorted.length.toLocaleString('fa-IR')} محصول
        </p>

        {sorted.length === 0 ? (
          <div className={styles.empty} role="status">
            <p>
              {unavailable && products.length === 0
                ? 'دریافت محصولات ناموفق بود. کمی بعد دوباره تلاش کنید.'
                : 'محصولی با این جستجو و فیلترها پیدا نشد.'}
            </p>
            {unavailable && products.length === 0 ? (
              <button
                type="button"
                className={styles.more}
                onClick={() => router.refresh()}
              >
                تلاش دوباره
              </button>
            ) : (
              <button type="button" className={styles.more} onClick={clearAll}>
                پاک کردن جستجو و فیلترها
              </button>
            )}
          </div>
        ) : (
          <ul className={styles.grid}>
            {visible.map(product => (
              <li key={product.id}>
                <ProductCard {...toProductCardData(product)} />
              </li>
            ))}
          </ul>
        )}

        {/* نقطهٔ تریگر اسکرول بی‌نهایت روی همان مجموعهٔ فیلترشده */}
        <div ref={sentinelRef} aria-hidden="true" className={styles.sentinel} />

        {hasMore && sorted.length > 0 && (
          <button
            type="button"
            className={styles.more}
            onClick={() =>
              setVisibleCount(previous =>
                Math.min(previous + BLACK_FRIDAY_PAGE_SIZE, sorted.length),
              )
            }
          >
            محصولات بیشتر
          </button>
        )}
      </div>
    </section>
  );
}
