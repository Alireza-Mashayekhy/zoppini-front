// components/products/product-list.tsx
'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import ProductCard from '@/components/shared/product-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import {
  buildNextPageQuery,
  buildProductListQuery,
  productQueriesEqual,
} from '@/lib/product-list-params';
import { DEFAULT_PRODUCT_SORT, PRODUCT_SORT_OPTIONS } from '@/lib/product-sort';
import { cn } from '@/lib/utils';
import { ApiListResponse } from '@/services/api/types';
import { ProductsResponse } from '@/services/features/products/type';

import ProductFilter from './product-filter';

interface ProductListProps {
  initialData: ApiListResponse<ProductsResponse>;
  initialParams: {
    page: number;
    limit: number;
    search: string;
    sort: string;
    categoryIds?: number[];
    colorIds?: number[];
    sizeIds?: number[];
  };
  discounted?: boolean;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:3000/api/';

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

function Dot({
  col,
  row,
  active,
}: {
  col: number;
  row: number;
  active: boolean;
}) {
  return (
    <div
      className="grid gap-0.5 "
      style={{
        gridTemplateColumns: `repeat(${col}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: col * row }, (_, index) => (
        <span
          key={index}
          className={cn(
            'block w-1 h-1 rounded-full transition-all',
            active ? 'bg-gray-800' : 'bg-gray-400 group-hover:bg-gray-800',
          )}
        />
      ))}
    </div>
  );
}

export default function ProductList({
  initialData,
  initialParams,
  discounted = false,
}: ProductListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isScrollingDown = useScrollDirection();

  // State برای فیلترها
  const [sort, setSort] = useState(initialParams.sort || DEFAULT_PRODUCT_SORT);
  const [colorIds, setColorIds] = useState<number[]>(
    initialParams.colorIds || [],
  );
  const [sizeIds, setSizeIds] = useState<number[]>(initialParams.sizeIds || []);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [rows, setRows] = useState(4);

  // تعداد فیلترهای فعال
  const activeFilterCount = colorIds.length + sizeIds.length;

  // State برای Infinite Scroll
  const [items, setItems] = useState<ProductsResponse[]>(
    initialData.data || [],
  );
  const [page, setPage] = useState(initialParams.page || 1);
  const [hasMore, setHasMore] = useState(
    initialData.pagination
      ? initialData.pagination.page < initialData.pagination.totalPages
      : false,
  );
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // تابع بارگذاری صفحه بعدی
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const nextPage = page + 1;
      const params = {
        page: nextPage,
        limit: initialParams.limit || 24,
        search: initialParams.search || '',
        sort,
        categoryIds: initialParams.categoryIds,
        colorIds,
        sizeIds,
      };

      // ساخت query string
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(params.page));
      queryParams.append('limit', String(params.limit));
      if (params.search) queryParams.append('search', params.search);
      queryParams.append('sort', params.sort || DEFAULT_PRODUCT_SORT);
      if (params.categoryIds?.length) {
        queryParams.append('categoryIds', params.categoryIds.join(','));
      }
      if (params.colorIds?.length) {
        queryParams.append('colorIds', params.colorIds.join(','));
      }
      if (params.sizeIds?.length) {
        queryParams.append('sizeIds', params.sizeIds.join(','));
      }

      const response = await fetch(
        `${BASE_URL}/${discounted ? 'products/discounted' : 'products'}?${queryParams.toString()}`,
      );
      const data = (await response.json()) as ApiListResponse<ProductsResponse>;

      setItems(prev => [...prev, ...data.data]);
      setPage(nextPage);
      setHasMore(
        data.pagination
          ? data.pagination.page < data.pagination.totalPages
          : false,
      );
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    loading,
    hasMore,
    sort,
    colorIds,
    sizeIds,
    initialParams,
    discounted,
  ]);

  // تنظیم Intersection Observer
  useEffect(() => {
    const currentLoader = loaderRef.current;
    if (!currentLoader) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      {
        threshold: 0,
        // لود زودتر از رسیدن کاربر به انتها (۶۰۰ پیکسل مانده به پایین viewport)
        rootMargin: '0px 0px 1000px 0px',
      },
    );

    observer.observe(currentLoader);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  // ریست کردن لیست وقتی فیلترها یا مرتب‌سازی تغییر می‌کنند
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(initialData.data || []);
    setPage(initialParams.page || 1);
    setHasMore(
      initialData.pagination
        ? initialData.pagination.page < initialData.pagination.totalPages
        : false,
    );
  }, [initialData, sort, colorIds, sizeIds]);

  // تابع اعمال فیلترها (بازخوانی کامل صفحه)
  const handleApplyFilters = (newColorIds: number[], newSizeIds: number[]) => {
    setColorIds(newColorIds);
    setSizeIds(newSizeIds);
    // برای دریافت داده‌های جدید از سرور، صفحه را رفرش می‌کنیم
    router.refresh();
  };

  const handleClearFilters = () => {
    setColorIds([]);
    setSizeIds([]);
    if (isFilterOpen) setIsFilterOpen(false);
    router.refresh();
  };

  // به‌روزرسانی URL برای فیلترها و مرتب‌سازی.
  //
  // این افکت فقط همان پارامترهایی را که خودش مدیریت می‌کند (sort/colorIds/
  // sizeIds) بازنویسی می‌کند و بقیه‌ی آدرس — مهم‌تر از همه `search` — را
  // دست‌نخورده نگه می‌دارد. پیش‌تر آدرس از صفر ساخته می‌شد و `search` در آن
  // نبود؛ نتیجه این بود که بعد از «مشاهده همه نتایج»، جستجو چند لحظه نمایش
  // داده می‌شد و بعد آدرس به `?sort=createdAt:desc` می‌پرید.
  //
  // آدرس جاری را از window می‌خوانیم و به searchParams وابسته نمی‌شویم؛
  // وگرنه با هر back/forward کاربر، state قدیمی دوباره روی آدرس نوشته می‌شد
  // و دکمه‌ی بازگشت مرورگر بی‌اثر می‌شد.
  useEffect(() => {
    const query = buildProductListQuery(window.location.search, {
      sort,
      colorIds,
      sizeIds,
    });

    // اگر آدرس همین حالا همان چیزی است که می‌خواهیم، replace نکن.
    if (productQueriesEqual(window.location.search, query)) return;

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [sort, colorIds, sizeIds, router, pathname]);

  // لینک «محصولات بیشتر» هم باید search و بقیه فیلترها را با خود ببرد
  const nextPageQuery = buildNextPageQuery({
    ...initialParams,
    sort,
    colorIds,
    sizeIds,
    page: page + 1,
  });

  const gridClass =
    rows === 3
      ? 'grid-cols-2 sm:grid-cols-3'
      : rows === 4
        ? 'grid-cols-2 sm:grid-cols-4'
        : 'grid-cols-2 sm:grid-cols-6';

  return (
    <div className="flex flex-col">
      {/* نوار بالایی */}
      <div
        className={cn(
          'sticky z-30 flex h-20 items-center justify-between gap-4 border-t bg-background/80 px-6 backdrop-blur-xl transition-[top] duration-300',
          isScrollingDown ? 'top-0' : 'top-[52px]',
        )}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setIsFilterOpen(true)}
            className="relative"
          >
            فیلترها
            {activeFilterCount > 0 && (
              <Badge
                variant="default"
                className="mr-1 w-5 h-5 flex items-center justify-center rounded-full bg-primary text-background"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          <div className="flex gap-1 items-center">
            <span className="text-xs">مرتب‌سازی:</span>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger
                noIcon
                className="w-fit border border-primary outline-0! ring-0! shadow-none!"
              >
                <SelectValue placeholder="مرتب‌سازی..." />
                <ChevronDown />
              </SelectTrigger>
              <SelectContent position="popper">
                {PRODUCT_SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="items-center hidden sm:flex">
          <Button
            variant="ghost"
            onClick={() => setRows(3)}
            className={'group'}
          >
            <Dot active={rows === 3} col={3} row={1} />
          </Button>
          <Button
            variant="ghost"
            onClick={() => setRows(4)}
            className={'group'}
          >
            <Dot active={rows === 4} col={4} row={2} />
          </Button>
          <Button
            variant="ghost"
            onClick={() => setRows(6)}
            className={'group'}
          >
            <Dot active={rows === 6} col={6} row={3} />
          </Button>
        </div>
      </div>

      {/* مودال فیلتر */}
      <ProductFilter
        selectedColorIds={colorIds}
        selectedSizeIds={sizeIds}
        onApplyFilters={handleApplyFilters}
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        onClearFilters={handleClearFilters}
      />

      {/* لیست محصولات */}
      <main className="flex-1">
        {items.length === 0 && !loading ? (
          <div className="text-center py-12 text-gray-500">محصولی یافت نشد</div>
        ) : (
          <div className={`grid gap-1 ${gridClass}`}>
            {items.map(product => (
              <ProductCard
                key={product.id}
                id={product.id}
                image={product.image}
                title={product.title}
                price={product.variants?.[0]?.price || 0}
                slug={product.slug}
                discount={product?.discount}
              />
            ))}

            {loading &&
              Array.from({ length: initialParams.limit || 10 }).map(
                (_, idx) => <ProductCardSkeleton key={`skeleton-${idx}`} />,
              )}
          </div>
        )}

        <div ref={loaderRef} aria-hidden="true" className="h-px" />

        {!loading && hasMore && (
          <div className="mt-10 flex justify-center">
            <Link
              href={nextPageQuery ? `?${nextPageQuery}` : '?'}
              className="text-sm underline"
            >
              محصولات بیشتر
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
