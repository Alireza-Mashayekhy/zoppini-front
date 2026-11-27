import {
  getDiscountedProducts,
  getProducts,
} from '@/services/features/products/server.api';
import type { ProductsResponse } from '@/services/features/products/type';

import {
  BLACK_FRIDAY_API_SORT,
  BLACK_FRIDAY_CATEGORY_ID,
  BLACK_FRIDAY_PAGE_SIZE,
} from './campaign';
import { scanProductPages } from './catalog-scan';
import { type NormalizedPagination, normalizePagination } from './pagination';

/** The complete campaign category, read before constructing the collection. */
export type BlackFridayCatalog = {
  products: ProductsResponse[];
  initialPage: ProductsResponse[];
  pagination: NormalizedPagination;
  pagesScanned: number;
  truncated: boolean;
};

export async function loadBlackFridayCatalog(): Promise<BlackFridayCatalog> {
  const pages = await scanProductPages(page =>
    getProducts({
      categoryIds: [BLACK_FRIDAY_CATEGORY_ID],
      limit: BLACK_FRIDAY_PAGE_SIZE,
      page,
      sort: BLACK_FRIDAY_API_SORT,
    }),
  );

  return {
    products: pages.flatMap(page => page.data),
    initialPage: pages[0].data,
    pagination: normalizePagination(pages[0].pagination, 1),
    pagesScanned: pages.length,
    truncated: false,
  };
}

/** Read the complete store-wide active-sale scope, including campaign members. */
export async function loadDiscountedProducts(): Promise<ProductsResponse[]> {
  const pages = await scanProductPages(page =>
    getDiscountedProducts({
      limit: BLACK_FRIDAY_PAGE_SIZE,
      page,
      sort: BLACK_FRIDAY_API_SORT,
    }),
  );
  return pages.flatMap(page => page.data);
}
