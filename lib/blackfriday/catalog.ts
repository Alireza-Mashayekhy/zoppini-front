import {
  getDiscountedProducts,
  getProducts,
} from '@/services/features/products/server.api';
import type { ProductsResponse } from '@/services/features/products/type';

import { BLACK_FRIDAY_API_SORT, BLACK_FRIDAY_CATEGORY_ID } from './campaign';
import { type ScanOptions, scanProductPages } from './catalog-scan';
import { slimProductForListing } from './slim';

/**
 * Server-side page size for the complete scans.
 *
 * The visible list still pages by 24 on the client; this is only how many
 * rows are requested per backend call. 100 is the same upper bound the
 * category archive accepts for `?limit=`. With ~1,050 discounted products it
 * turns 44 + 8 backend requests per scan into 11 + 2, which matters because
 * all server-side requests share one IP quota on the global Nest throttler
 * (100 requests / minute).
 */
export const BLACK_FRIDAY_SCAN_PAGE_SIZE = 100;

/** Per-request timeout; a hung backend must not hang the render forever. */
export const BLACK_FRIDAY_REQUEST_TIMEOUT_MS = 20_000;

export type CatalogScanResult = {
  products: ProductsResponse[];
  total: number;
  consistent: boolean;
  requests: number;
};

function timeoutSignal(): AbortSignal | undefined {
  return typeof AbortSignal !== 'undefined' &&
    typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(BLACK_FRIDAY_REQUEST_TIMEOUT_MS)
    : undefined;
}

/**
 * Campaign membership: everything in category 137 (and its subcategories).
 * Same endpoint and parameters as the category archive
 * (`/product-category/zoppini-black-friday`), only read completely.
 */
export async function loadBlackFridayCatalog(
  options: ScanOptions = {},
): Promise<CatalogScanResult> {
  const result = await scanProductPages(
    page =>
      getProducts(
        {
          categoryIds: [BLACK_FRIDAY_CATEGORY_ID],
          limit: BLACK_FRIDAY_SCAN_PAGE_SIZE,
          page,
          sort: BLACK_FRIDAY_API_SORT,
        },
        { signal: timeoutSignal() },
      ),
    { label: 'products?categoryIds=137', ...options },
  );

  return { ...result, products: result.products.map(slimProductForListing) };
}

/** Read the complete store-wide active-sale scope, including campaign members. */
export async function loadDiscountedProducts(
  options: ScanOptions = {},
): Promise<CatalogScanResult> {
  const result = await scanProductPages(
    page =>
      getDiscountedProducts(
        {
          limit: BLACK_FRIDAY_SCAN_PAGE_SIZE,
          page,
          sort: BLACK_FRIDAY_API_SORT,
        },
        { signal: timeoutSignal() },
      ),
    { label: 'products/discounted', ...options },
  );

  return { ...result, products: result.products.map(slimProductForListing) };
}
