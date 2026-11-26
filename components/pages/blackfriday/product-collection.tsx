'use client';

import { ChevronDown, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import ProductCard from '@/components/shared/product-card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { useTypewriterPlaceholder } from '@/hooks/use-typewriter-placeholder';
import type { StoreTopCategory } from '@/lib/blackfriday/campaign';
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
 * بخش پنجم — همهٔ محصولات واجد بلک فرایدی (۷۰٪ + ۲۰٪).
 *
 * مجموعهٔ واجد در سرور خوانده و به‌صورت متوازن درهم‌تنیده شده است
 * (دو محصول ۷۰٪ و دو محصول ۲۰٪ در هر یک از دو ردیف اول) و همان مجموعه به
 * اینجا می‌رسد؛ پس جستجو و فیلترهای دسته/سایز/رنگ/قیمت روی همان مجموعه،
 * بدون درخواست تازه و بدون ریلود صفحه، اعمال می‌شوند و با هم ترکیب
 * می‌شوند. تغییر هر فیلتر یا مرتب‌سازی، بقیه را پاک نمی‌کند.
 *
 * نوار فیلتر compact و ریسپانسیو است: جست‌وجو، مرتب‌سازی و دکمهٔ
 * «فیلترها» همیشه در دسترس‌اند؛ دسته‌های اصلی فروشگاه در یک ردیف
 * افقی-اسکرول‌پذیر نمایش داده می‌شوند و سایز/رنگ/قیمت داخل پنل فیلتر
 * (دسکتاپ) یا کش‌آپِ موبایل هستند. مرتب‌سازی پیش‌فرض «ترکیب پیشنهادی»
 * همان ترتیب متوازن سرور است.
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
  /** دسته‌بندی‌های لازم برای درخت فیلترِ کلاینت */
  categories: CategoriesResponse[];
  /** هشت دسته‌بندی اصلیِ ناوبری فروشگاه (منبع حقیقت) */
  topCategories: StoreTopCategory[];
  /** true یعنی خواندن محصولات در سرور ناموفق بوده است */
  unavailable?: boolean;
};

const formatToman = (value: number) =>
  Math.max(0, Math.round(value)).toLocaleString('fa-IR');

export function ProductCollection({
  products,
  categories,
  topCategories,
  unavailable = false,
}: ProductCollectionProps) {
  const router = useRouter();

  const [filters, setFilters] = useState<BlackFridayFilters>(
    EMPTY_BLACK_FRIDAY_FILTERS,
  );
  const [sort, setSort] = useState<BlackFridaySortValue>('balanced');
  const [visibleCount, setVisibleCount] = useState(BLACK_FRIDAY_PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const categoryIndex = useMemo(
    () => buildCategoryIndex(categories),
    [categories],
  );

  const categoryOptions = useMemo(
    () =>
      topCategories.map(category => ({
        id: category.id,
        name: category.name,
      })),
    [topCategories],
  );

  const options = useMemo(
    () => deriveBlackFridayFilterOptions(products, categoryOptions),
    [products, categoryOptions],
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
    (filters.categoryId !== null ? 1 : 0) +
    filters.sizeIds.length +
    filters.colorIds.length +
    (filters.priceMin !== undefined || filters.priceMax !== undefined ? 1 : 0);

  const selectedCategory =
    filters.categoryId !== null
      ? (categoryOptions.find(category => category.id === filters.categoryId) ??
        null)
      : null;

  // تایپرایتر placeholder: متوقف می‌شود هنگام فوکوس یا تایپ، و از نو شروع
  // می‌شود وقتی المنت بی‌فوکوس و خالی باشد.
  const phrases = useMemo(
    () => categoryOptions.map(category => `جستجو در ${category.name}…`),
    [categoryOptions],
  );
  const placeholder = useTypewriterPlaceholder(
    phrases,
    searchFocused || filters.search.length > 0,
  );

  // با هر تغییر فیلتر/جستجو/مرتب‌سازی، نمایش از اول شروع می‌شود
  const resetVisible = () => setVisibleCount(BLACK_FRIDAY_PAGE_SIZE);

  const updateFilters = (next: Partial<BlackFridayFilters>) => {
    setFilters(previous => ({ ...previous, ...next }));
    resetVisible();
  };

  const changeSearch = (value: string) => {
    updateFilters({ search: value });
  };

  const changeCategory = (id: number | null) => {
    updateFilters({ categoryId: id });
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
      [key]:
        parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined,
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

  // در دسکتاپ کش‌آپ فیلتر پنهان است؛ هنگام تغییر به دسکتاپ آن را ببند.
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setFiltersOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  // بستن پنل/کش‌آپ فیلتر با کلید Escape (فقط وقتی باز است). کلیک/تایپ/اسکرول
  // داخل پنل آن را نمی‌بندد؛ فقط Escape، کلیک روی backdrop، یا دکمهٔ بستن.
  useEffect(() => {
    if (!filtersOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFiltersOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [filtersOpen]);

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
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={placeholder}
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

          <label className={styles.sortLabel}>
            <span>مرتب‌سازی</span>
            <span className={styles.sortSelectWrap}>
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
              <ChevronDown className={styles.sortChevron} aria-hidden="true" />
            </span>
          </label>

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
        </div>

        <div
          className={styles.categoryRow}
          role="group"
          aria-label="فیلتر دسته‌بندی"
        >
          <button
            type="button"
            className={
              filters.categoryId === null
                ? styles.catChipActive
                : styles.catChip
            }
            aria-pressed={filters.categoryId === null}
            onClick={() => changeCategory(null)}
          >
            همه دسته‌ها
          </button>
          {topCategories.map(category => {
            const active = filters.categoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                className={active ? styles.catChipActive : styles.catChip}
                aria-pressed={active}
                onClick={() => changeCategory(active ? null : category.id)}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        {(selectedCategory ||
          filters.sizeIds.length > 0 ||
          filters.colorIds.length > 0 ||
          filters.priceMin !== undefined ||
          filters.priceMax !== undefined) && (
          <div className={styles.activeRow} aria-label="فعال‌های انتخاب‌شده">
            {selectedCategory && (
              <span className={styles.activeChip}>
                {selectedCategory.name}
                <button
                  type="button"
                  className={styles.activeRemove}
                  onClick={() => changeCategory(null)}
                  aria-label={`پاک کردن ${selectedCategory.name}`}
                >
                  ×
                </button>
              </span>
            )}
            {filters.sizeIds.map(sizeId => {
              const size = options.sizes.find(size => size.id === sizeId);
              if (!size) return null;
              return (
                <span key={`size-${sizeId}`} className={styles.activeChip}>
                  {size.name}
                  <button
                    type="button"
                    className={styles.activeRemove}
                    onClick={() => toggleSize(sizeId)}
                    aria-label={`پاک کردن سایز ${size.name}`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
            {filters.colorIds.map(colorId => {
              const color = options.colors.find(color => color.id === colorId);
              if (!color) return null;
              return (
                <span key={`color-${colorId}`} className={styles.activeChip}>
                  <span
                    aria-hidden="true"
                    className={styles.swatch}
                    style={{ backgroundColor: color.hexCode }}
                  />
                  {color.name}
                  <button
                    type="button"
                    className={styles.activeRemove}
                    onClick={() => toggleColor(colorId)}
                    aria-label={`پاک کردن رنگ ${color.name}`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
            {(filters.priceMin !== undefined ||
              filters.priceMax !== undefined) && (
              <span className={styles.activeChip}>
                {`${
                  filters.priceMin !== undefined
                    ? formatToman(filters.priceMin)
                    : '۰۰'
                } – ${
                  filters.priceMax !== undefined
                    ? formatToman(filters.priceMax)
                    : '∞'
                } تومان`}
                <button
                  type="button"
                  className={styles.activeRemove}
                  onClick={() =>
                    updateFilters({ priceMin: undefined, priceMax: undefined })
                  }
                  aria-label="پاک کردن محدوده قیمت"
                >
                  ×
                </button>
              </span>
            )}
            <button
              type="button"
              className={styles.clearAll}
              onClick={clearAll}
            >
              پاک کردن همه
            </button>
          </div>
        )}

        {/* پنل فیلتر دسکتاپ: سایز/رنگ/قیمت (دسته‌ها در ردیف چیپ‌ها هستند) */}
        <div
          id="bf-filters"
          className={`${styles.panel} ${filtersOpen ? styles.panelOpen : ''}`}
        >
          <FilterControls
            options={options}
            filters={filters}
            showCategories={false}
            categoryOptions={[]}
            activeCategoryId={null}
            onToggleCategory={() => {}}
            onToggleSize={toggleSize}
            onToggleColor={toggleColor}
            onChangePrice={changePrice}
          />
          {hasActiveFilters && (
            <div className={styles.panelActions}>
              <button
                type="button"
                className={styles.clearAll}
                onClick={clearAll}
              >
                پاک کردن همه
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

      {/* کش‌آپ فیلتر موبایل: تک‌ستون، actions موقت، scrowlock و safe-area */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className={`${styles.sheetContent} lg:hidden min-h-0 gap-0 rounded-t-2xl bg-white p-0 shadow-2xl data-[side=bottom]:h-[min(92dvh,640px)]`}
        >
          <div className={styles.sheetHeader}>
            <SheetTitle>فیلترها</SheetTitle>
            <SheetDescription className={styles.srOnly}>
              تنظیم دسته‌بندی، سایز، رنگ و محدوده قیمت محصولات.
            </SheetDescription>
            <button
              type="button"
              className={styles.sheetClose}
              onClick={() => setFiltersOpen(false)}
              aria-label="بستن فیلترها"
            >
              <X className={styles.sheetCloseIcon} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.sheetBody}>
            <FilterControls
              options={options}
              filters={filters}
              showCategories
              categoryOptions={categoryOptions}
              activeCategoryId={filters.categoryId}
              onToggleCategory={changeCategory}
              onToggleSize={toggleSize}
              onToggleColor={toggleColor}
              onChangePrice={changePrice}
            />
          </div>

          <div className={styles.sheetFooter}>
            <button
              type="button"
              className={styles.sheetActionSecondary}
              onClick={clearAll}
            >
              پاک کردن
            </button>
            <button
              type="button"
              className={styles.sheetActionPrimary}
              onClick={() => setFiltersOpen(false)}
            >
              اعمال فیلترها
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

type FilterControlsProps = {
  options: ReturnType<typeof deriveBlackFridayFilterOptions>;
  filters: BlackFridayFilters;
  showCategories: boolean;
  categoryOptions: { id: number; name: string }[];
  activeCategoryId: number | null;
  onToggleCategory: (id: number | null) => void;
  onToggleSize: (id: number) => void;
  onToggleColor: (id: number) => void;
  onChangePrice: (key: 'priceMin' | 'priceMax', value: string) => void;
};

/**
 * زیرمجموعهٔ کنترل‌های فیلتر (دسته/سایز/رنگ/قیمت). هم در پنلِ دسکتاپ و هم
 * در کش‌آپ موبایل از آن استفاده می‌شود؛ نمایش دسته‌ها با `showCategories`
 * کنترل می‌شود تا دسکتاپ آن‌ها را در ردیف چیپ‌های بالاست نشان دهد.
 */
function FilterControls({
  options,
  filters,
  showCategories,
  categoryOptions,
  activeCategoryId,
  onToggleCategory,
  onToggleSize,
  onToggleColor,
  onChangePrice,
}: FilterControlsProps) {
  return (
    <div className={styles.controls}>
      {showCategories && (
        <section
          className={`${styles.controlSection} ${styles.controlSectionCat}`}
          aria-labelledby="filter-cat"
        >
          <h3 id="filter-cat" className={styles.controlHeading}>
            دسته‌بندی
          </h3>
          <div className={styles.controlChips}>
            <button
              type="button"
              className={
                activeCategoryId === null
                  ? styles.catChipActive
                  : styles.catChip
              }
              aria-pressed={activeCategoryId === null}
              onClick={() => onToggleCategory(null)}
            >
              همه دسته‌ها
            </button>
            {categoryOptions.map(category => {
              const active = activeCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  className={active ? styles.catChipActive : styles.catChip}
                  aria-pressed={active}
                  onClick={() => onToggleCategory(active ? null : category.id)}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {options.sizes.length > 0 && (
        <section
          className={styles.controlSection}
          aria-labelledby="filter-size"
        >
          <h3 id="filter-size" className={styles.controlHeading}>
            سایز
          </h3>
          <div className={styles.controlChips}>
            {options.sizes.map(size => {
              const active = filters.sizeIds.includes(size.id);
              return (
                <button
                  key={size.id}
                  type="button"
                  className={active ? styles.chipActive : styles.chip}
                  aria-pressed={active}
                  onClick={() => onToggleSize(size.id)}
                >
                  {size.name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {options.colors.length > 0 && (
        <section
          className={styles.controlSection}
          aria-labelledby="filter-color"
        >
          <h3 id="filter-color" className={styles.controlHeading}>
            رنگ
          </h3>
          <div className={styles.controlChips}>
            {options.colors.map(color => {
              const active = filters.colorIds.includes(color.id);
              return (
                <button
                  key={color.id}
                  type="button"
                  className={active ? styles.chipActive : styles.chip}
                  aria-pressed={active}
                  onClick={() => onToggleColor(color.id)}
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
        </section>
      )}

      <section className={styles.controlSection} aria-labelledby="filter-price">
        <h3 id="filter-price" className={styles.controlHeading}>
          محدوده قیمت (تومان)
        </h3>
        <div className={styles.priceRow}>
          <label className={styles.priceField}>
            <span className={styles.srOnly}>حداقل قیمت</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={formatToman(options.minPrice)}
              value={filters.priceMin ?? ''}
              onChange={event => onChangePrice('priceMin', event.target.value)}
            />
          </label>
          <span className={styles.priceSep} aria-hidden="true">
            تا
          </span>
          <label className={styles.priceField}>
            <span className={styles.srOnly}>حداکثر قیمت</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={formatToman(options.maxPrice)}
              value={filters.priceMax ?? ''}
              onChange={event => onChangePrice('priceMax', event.target.value)}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
