// components/products/product-list.tsx
'use client';

import { ChevronDown } from 'lucide-react';
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
import { useScrollDirection } from '@/hooks/use-scroll-direction';
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
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:3000/api/';

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
}: ProductListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isScrollingDown = useScrollDirection();

  // State برای فیلترها
  const [sort, setSort] = useState(initialParams.sort || 'createdAt:asc');
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
  const [page, setPage] = useState(1);
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
        limit: initialParams.limit || 10,
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
      if (params.sort)
        queryParams.append('sort', params.sort || 'createdAt:asc');
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
        `${BASE_URL}/products?${queryParams.toString()}`,
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
  }, [page, loading, hasMore, sort, colorIds, sizeIds, initialParams]);

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
      { threshold: 0.1 },
    );

    observer.observe(currentLoader);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  // ریست کردن لیست وقتی فیلترها یا مرتب‌سازی تغییر می‌کنند
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(initialData.data || []);
    setPage(1);
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

  // به‌روزرسانی URL برای فیلترها
  useEffect(() => {
    const params = new URLSearchParams();
    if (sort) params.append('sort', sort);
    if (colorIds.length) params.append('colorIds', colorIds.join(','));
    if (sizeIds.length) params.append('sizeIds', sizeIds.join(','));
    if (initialParams.page > 1)
      params.append('page', String(initialParams.page));
    if (initialParams.limit !== 10)
      params.append('limit', String(initialParams.limit));
    const url = `${pathname}?${params.toString()}`;
    router.replace(url, { scroll: false });
  }, [
    sort,
    colorIds,
    sizeIds,
    router,
    pathname,
    initialParams.page,
    initialParams.limit,
  ]);

  return (
    <div className="flex flex-col">
      {/* نوار بالایی */}
      <div
        className={cn(
          'sticky z-10 flex h-20 items-center justify-between gap-4 border-t bg-background/80 px-6 backdrop-blur-xl transition-[top] duration-300',
          isScrollingDown ? 'top-0' : 'top-[52px]',
        )}
      >
        {' '}
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
                <SelectItem value="createdAt:asc">جدیدترین</SelectItem>
                <SelectItem value="price:asc">ارزان ترین</SelectItem>
                <SelectItem value="price:desc">گران ترین</SelectItem>
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
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">محصولی یافت نشد</div>
        ) : (
          <div
            className={`grid gap-1 ${
              rows === 3
                ? 'grid-cols-2 sm:grid-cols-3'
                : rows === 4
                  ? 'grid-cols-2 sm:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-6'
            }`}
          >
            {' '}
            {items.map(product => (
              <ProductCard
                key={product.id}
                image={product.image}
                title={product.title}
                price={product.variants[0]?.price || 0}
                slug={product.slug}
                discount={product?.discount}
              />
            ))}
          </div>
        )}

        {/* المنت observer */}
        <div ref={loaderRef} className="h-10 flex justify-center items-center">
          {loading && (
            <span className="text-sm text-gray-500">در حال بارگذاری...</span>
          )}
        </div>
      </main>
    </div>
  );
}
