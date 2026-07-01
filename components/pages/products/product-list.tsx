// components/products/product-list.tsx
'use client';

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

export default function ProductList({
  initialData,
  initialParams,
}: ProductListProps) {
  const router = useRouter();
  const pathname = usePathname();

  // State برای فیلترها
  const [sort, setSort] = useState(initialParams.sort || 'createdAt:desc');
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
        queryParams.append('sort', params.sort || 'createdAt:desc');
      if (params.categoryIds?.length) {
        queryParams.append('categoryIds', params.categoryIds.join(','));
      }
      if (params.colorIds?.length) {
        queryParams.append('colorIds', params.colorIds.join(','));
      }
      if (params.sizeIds?.length) {
        queryParams.append('sizeIds', params.sizeIds.join(','));
      }

      const response = await fetch(`/api/products?${queryParams.toString()}`);
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
      <div className="flex items-center justify-between gap-4 px-6 h-20 sticky top-[52px] bg-background z-10 border-t">
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
                className="mr-1 w-5 h-5 flex items-center justify-center rounded-full bg-gray-800 text-background"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger
              noIcon
              className="w-fit border-none outline-0! ring-0! shadow-none!"
            >
              <SelectValue placeholder="مرتب‌سازی..." />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="createdAt:desc">جدیدترین</SelectItem>
              <SelectItem value="title:asc">عنوان (صعودی)</SelectItem>
              <SelectItem value="title:desc">عنوان (نزولی)</SelectItem>
              <SelectItem value="price:asc">گران ترین</SelectItem>
              <SelectItem value="price:desc">ارزان ترین</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRows(3)}
            className={rows === 3 ? 'underline' : ''}
          >
            3
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRows(4)}
            className={rows === 4 ? 'underline' : ''}
          >
            4
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRows(6)}
            className={rows === 6 ? 'underline' : ''}
          >
            6
          </Button>
          <span className="mr-2">نمایش</span>
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
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
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
