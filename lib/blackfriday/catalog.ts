import type { ApiListResponse } from '@/services/api/types';
import { getProducts } from '@/services/features/products/server.api';
import type { ProductsResponse } from '@/services/features/products/type';

import {
  BLACK_FRIDAY_API_SORT,
  BLACK_FRIDAY_CATEGORY_ID,
  BLACK_FRIDAY_MAX_SCAN_PAGES,
  BLACK_FRIDAY_PAGE_SIZE,
} from './campaign';
import { type NormalizedPagination, normalizePagination } from './pagination';
import { mergeUniqueProducts } from './products';

/**
 * خواندن محصولات واقعی کمپین از API فروشگاه.
 *
 * درخواست اول همان درخواست صفحهٔ اول لیست است
 * (`/api/products?categoryIds=137&limit=24&page=1`) و همان صفحه به‌عنوان
 * محتوای اولیهٔ بند محصولات به کلاینت می‌رود؛ پس صفحهٔ اول دو بار درخواست
 * نمی‌شود و بقیهٔ لیست از صفحهٔ ۲ با همان صفحه‌بندی ادامه می‌یابد.
 *
 * چون API مرتب‌سازی بر اساس درصد تخفیف ندارد و مرتب‌سازی پیش‌فرض هم قیمت/
 * جدیدترین است، صفحه‌های بعدی هم خوانده می‌شوند تا «بیشترین تخفیف‌ها» از کل
 * دسته انتخاب شود، نه فقط از صفحهٔ اول. سقفِ `BLACK_FRIDAY_MAX_SCAN_PAGES`
 * جلوی درخواست بی‌پایان را می‌گیرد و پرچم `truncated` نشان می‌دهد همهٔ دسته
 * اسکن نشده است.
 */
export type BlackFridayCatalog = {
  /** همهٔ محصولات اسکن‌شده، بدون تکرار؛ فقط برای رتبه‌بندی تخفیف‌ها */
  products: ProductsResponse[];
  /** همان محصولات صفحهٔ اول؛ محتوای اولیهٔ بند «همهٔ محصولات» */
  initialPage: ProductsResponse[];
  /** صفحه‌بندی صفحهٔ اول؛ مبنای اسکرول بی‌نهایت */
  pagination: NormalizedPagination;
  pagesScanned: number;
  /** true اگر دسته بزرگ‌تر از سقف اسکن باشد */
  truncated: boolean;
};

export async function loadBlackFridayCatalog(): Promise<BlackFridayCatalog> {
  const firstPage = await getProducts({
    categoryIds: [BLACK_FRIDAY_CATEGORY_ID],
    limit: BLACK_FRIDAY_PAGE_SIZE,
    page: 1,
    sort: BLACK_FRIDAY_API_SORT,
  });

  const firstPagination = normalizePagination(firstPage.pagination, 1);
  const lastPageToScan = Math.min(
    firstPagination.totalPages,
    BLACK_FRIDAY_MAX_SCAN_PAGES,
  );

  const pages: ApiListResponse<ProductsResponse>[] = [firstPage];

  if (lastPageToScan > 1) {
    const results = await Promise.allSettled(
      Array.from({ length: lastPageToScan - 1 }, (_, index) =>
        getProducts({
          categoryIds: [BLACK_FRIDAY_CATEGORY_ID],
          limit: BLACK_FRIDAY_PAGE_SIZE,
          page: index + 2,
          sort: BLACK_FRIDAY_API_SORT,
        }),
      ),
    );

    // فقط تا اولین صفحهٔ ناموفق جلو می‌رویم تا در لیست حفره نیفتد؛ بقیهٔ
    // صفحه‌ها هنگام اسکرول از همان صفحهٔ اولِ جامانده خوانده می‌شوند.
    for (const result of results) {
      if (result.status !== 'fulfilled') break;
      pages.push(result.value);
    }
  }

  return {
    products: mergeUniqueProducts(
      pages.map(page => (Array.isArray(page.data) ? page.data : [])),
    ),
    initialPage: Array.isArray(firstPage.data) ? firstPage.data : [],
    pagination: firstPagination,
    pagesScanned: pages.length,
    truncated: firstPagination.totalPages > lastPageToScan,
  };
}
