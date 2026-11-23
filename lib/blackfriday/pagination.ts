import type { PaginationMeta } from '@/services/api/types';
import type { ProductsResponse } from '@/services/features/products/type';

import { mergeUniqueProducts } from './products';

/**
 * خواندن امنِ `pagination` پاسخ API.
 *
 * پاسخ همیشه `page/limit/total/totalPages` را برمی‌گرداند، ولی برای اینکه یک
 * پاسخ ناقص (مثلاً در قطعیِ بک‌اند) باعث حلقهٔ درخواست یا پنهان شدن محصولات
 * نشود، مقادیر اینجا نرمال می‌شوند:
 * - `page` دست‌کم ۱ است،
 * - `totalPages` هیچ‌وقت کمتر از `page` نیست،
 * - `hasMore` تنها وقتی true است که صفحهٔ بعدی واقعاً وجود داشته باشد.
 */
export type NormalizedPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

function positiveInteger(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0
    ? Math.trunc(numeric)
    : fallback;
}

export function normalizePagination(
  meta: Partial<PaginationMeta> | null | undefined,
  fallbackPage: number,
): NormalizedPagination {
  const page = positiveInteger(meta?.page, Math.max(1, fallbackPage));
  const totalPages = Math.max(page, positiveInteger(meta?.totalPages, page));
  const limit = positiveInteger(meta?.limit, 0);
  const totalNumeric = Number(meta?.total);
  const total =
    Number.isFinite(totalNumeric) && totalNumeric > 0
      ? Math.trunc(totalNumeric)
      : 0;

  return { page, limit, total, totalPages, hasMore: page < totalPages };
}

/**
 * آیا صفحهٔ بعدی باید خوانده شود؟
 *
 * هم‌زمان جلوی دو درخواست هم‌پوشان (نتیجهٔ IntersectionObserver تکراری) و
 * جلوی درخواست بعد از رسیدن به `totalPages` را می‌گیرد.
 */
export function shouldLoadPage({
  page,
  totalPages,
  loading,
}: {
  page: number;
  totalPages: number;
  loading: boolean;
}): boolean {
  if (loading) return false;
  return page + 1 <= totalPages;
}

/**
 * وضعیت فهرست محصولاتِ اسکرول بی‌نهایت.
 *
 * منطق «افزودن صفحه»، «حذف تکراری‌ها»، «ریست با تغییر فیلتر» و «پایانِ
 * لیست» اینجا و بیرون از React نگه داشته شده تا قابل تست باشد؛ هوک فقط
 * درخواست شبکه و IntersectionObserver را به آن وصل می‌کند.
 */
export type ProductListState = {
  items: ProductsResponse[];
  page: number;
  totalPages: number;
  loading: boolean;
  failed: boolean;
};

export function createProductListState({
  items = [],
  pagination,
}: {
  items?: ProductsResponse[];
  pagination?: Partial<PaginationMeta> | null;
} = {}): ProductListState {
  const normalized = normalizePagination(pagination, 1);

  return {
    items: mergeUniqueProducts([items]),
    page: normalized.page,
    totalPages: normalized.totalPages,
    loading: false,
    failed: false,
  };
}

export type ProductListAction =
  | { type: 'request-start' }
  | {
      type: 'page-loaded';
      incoming: ProductsResponse[];
      page: number;
      totalPages: number;
      /** true یعنی لیست از نو ساخته می‌شود (صفحهٔ ۱ با فیلتر تازه) */
      reset: boolean;
    }
  | { type: 'request-failed' }
  | { type: 'query-changed' };

export function productListReducer(
  state: ProductListState,
  action: ProductListAction,
): ProductListState {
  switch (action.type) {
    case 'request-start':
      return { ...state, loading: true, failed: false };

    case 'page-loaded': {
      const totalPages = Math.max(action.page, action.totalPages);

      return {
        items: action.reset
          ? mergeUniqueProducts([action.incoming])
          : mergeUniqueProducts([state.items, action.incoming]),
        page: action.page,
        totalPages,
        loading: false,
        failed: false,
      };
    }

    case 'request-failed':
      // صفحه پیش نمی‌رود تا تلاش بعدی همان صفحه را دوباره بخواهد.
      return { ...state, loading: false, failed: true };

    case 'query-changed':
      // اسکلت بارگذاری صفحهٔ اول؛ `hasMore` از ۰ < ۱ موقتاً true است.
      return { items: [], page: 0, totalPages: 1, loading: true, failed: false };

    default:
      return state;
  }
}
