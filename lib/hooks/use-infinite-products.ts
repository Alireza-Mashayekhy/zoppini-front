'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';

import {
  createProductListState,
  normalizePagination,
  productListReducer,
  shouldLoadPage,
} from '@/lib/blackfriday/pagination';
import type { ApiListResponse, PaginationMeta } from '@/services/api/types';
import type { ProductsResponse } from '@/services/features/products/type';

/**
 * اسکرول بی‌نهایتِ لیست محصولات لندینگ بلک فرایدی.
 *
 * رفتارش عیناً همان چیزی است که `components/pages/products/product-list.tsx`
 * در صفحه‌های دسته‌بندی انجام می‌دهد تا لندینگ مثل بقیهٔ فروشگاه کار کند:
 *
 * - همان اندازهٔ صفحه (۲۴) و همان پارامترهای API (`page`, `limit`, `sort`,
 *   `categoryIds`)،
 * - همان `IntersectionObserver` با `threshold: 0` و
 *   `rootMargin: '0px 0px 1000px 0px'` (شروع زودتر از رسیدن به انتها)،
 * - جلوگیری از درخواست هم‌پوشان و تکراری (ref + AbortController + state)،
 * - ادغام بدون تکرار محصولات،
 * - پایانِ لیست بر اساس `pagination.totalPages` واقعی،
 * - ریست کامل صفحه‌بندی وقتی فیلتر/مرتب‌سازی عوض می‌شود.
 *
 * تفاوتِ لازم با آن کامپوننت: لندینگ فیلتر رنگ/سایز/قیمت ندارد و
 * مرتب‌سازی «بیشترین تخفیف» را سمت کلاینت رتبه‌بندی می‌کند؛ بنابراین
 * state و درخواست‌ها همین‌جا نگه داشته می‌شوند و کامپوننتِ صفحه‌های
 * دسته‌بندی دست‌نخورده می‌ماند.
 *
 * منطق صفحه‌بندیِ خالص (افزودن صفحه، حذف تکرار، ریست، پایان لیست) در
 * `lib/blackfriday/pagination.ts` است و تست‌های واحد همان را می‌پوشانند.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:3000/api/';

export type InfiniteProductQuery = {
  /** همیشه شامل شناسهٔ دستهٔ اصلی کمپین است */
  categoryIds: number[];
  sort: string;
  limit: number;
};

export type UseInfiniteProductsOptions = {
  /** محصولات صفحهٔ اول که سرور از قبل خوانده است */
  initialItems: ProductsResponse[];
  /** صفحه‌بندی همان داده؛ ادامهٔ لیست از صفحهٔ بعدی شروع می‌شود */
  initialPagination?: Partial<PaginationMeta> | null;
  initialQuery: InfiniteProductQuery;
};

/** ساخت query string همان صفحه‌های محصولات فروشگاه. */
export function buildProductsQuery(
  query: InfiniteProductQuery,
  page: number,
): string {
  const params = new URLSearchParams();

  params.append('page', String(page));
  params.append('limit', String(query.limit));
  if (query.sort) params.append('sort', query.sort);
  if (query.categoryIds.length) {
    params.append('categoryIds', query.categoryIds.join(','));
  }

  return params.toString();
}

export function useInfiniteProducts({
  initialItems,
  initialPagination,
  initialQuery,
}: UseInfiniteProductsOptions) {
  const [state, dispatch] = useReducer(
    productListReducer,
    undefined,
    () =>
      createProductListState({
        items: initialItems,
        pagination: initialPagination,
      }),
  );

  const queryRef = useRef<InfiniteProductQuery>(initialQuery);
  const pageRef = useRef(state.page);
  const totalPagesRef = useRef(state.totalPages);
  const loadingRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const runRequest = useCallback(
    async (
      targetPage: number,
      activeQuery: InfiniteProductQuery,
      reset: boolean,
    ) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      loadingRef.current = true;
      dispatch({ type: 'request-start' });

      try {
        const response = await fetch(
          `${BASE_URL}/products?${buildProductsQuery(activeQuery, targetPage)}`,
          { signal: controller.signal, cache: 'no-store' },
        );

        if (!response.ok) {
          throw new Error(`Products request failed: ${response.status}`);
        }

        const data = (await response.json()) as ApiListResponse<ProductsResponse>;
        if (controller.signal.aborted) return;

        const incoming = Array.isArray(data.data) ? data.data : [];
        const pagination = normalizePagination(data.pagination, targetPage);

        pageRef.current = pagination.page;
        totalPagesRef.current = pagination.totalPages;
        dispatch({
          type: 'page-loaded',
          incoming,
          page: pagination.page,
          totalPages: pagination.totalPages,
          reset,
        });
      } catch (error) {
        // قطعِ درخواست یعنی یک درخواست تازه جای آن را گرفته است، نه خطا.
        if (controller.signal.aborted) return;
        console.error('Black Friday products request failed', error);
        dispatch({ type: 'request-failed' });
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          loadingRef.current = false;
        }
      }
    },
    [],
  );

  /** خواندن صفحهٔ بعد؛ اگر صفحه‌ای نمانده یا درخواستی در جریان است، کاری نمی‌کند. */
  const loadMore = useCallback(() => {
    if (
      !shouldLoadPage({
        page: pageRef.current,
        totalPages: totalPagesRef.current,
        loading: loadingRef.current,
      })
    ) {
      return;
    }

    void runRequest(pageRef.current + 1, queryRef.current, false);
  }, [runRequest]);

  /**
   * خواندن دوبارهٔ صفحهٔ ۱ با همان پارامترها؛ برای تلاش دوباره بعد از خطا
   * یا وقتی خواندن اولیه در سرور ناموفق بوده است.
   */
  const reload = useCallback(() => {
    pageRef.current = 0;
    totalPagesRef.current = 1;
    dispatch({ type: 'query-changed' });

    void runRequest(1, queryRef.current, true);
  }, [runRequest]);

  /**
   * تغییر مرتب‌سازی/فیلتر: صفحه‌بندی کامل ریست می‌شود و صفحهٔ ۱ با
   * پارامترهای تازه خوانده می‌شود (همان رفتار state-reset فروشگاه).
   */
  const updateQuery = useCallback(
    (next: Partial<InfiniteProductQuery>) => {
      queryRef.current = { ...queryRef.current, ...next };
      reload();
    },
    [reload],
  );

  const hasMore = state.page < state.totalPages;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      {
        threshold: 0,
        rootMargin: '0px 0px 1000px 0px',
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, hasMore, state.loading]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return {
    items: state.items,
    page: state.page,
    totalPages: state.totalPages,
    hasMore,
    loading: state.loading,
    failed: state.failed,
    sentinelRef,
    loadMore,
    reload,
    updateQuery,
  };
}
