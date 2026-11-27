import type { ApiListResponse } from '@/services/api/types';
import type { ProductsResponse } from '@/services/features/products/type';

/** Read every page in bounded batches. A partial or inconsistent scan is not a catalog. */
export async function scanProductPages(
  fetchPage: (page: number) => Promise<ApiListResponse<ProductsResponse>>,
): Promise<ApiListResponse<ProductsResponse>[]> {
  const first = await fetchPage(1);
  // QueryDto pagination values can be serialized as strings by the API.
  const meta = first.pagination;
  const total = meta?.total == null ? NaN : Number(meta.total);
  const totalPages = meta?.totalPages == null ? NaN : Number(meta.totalPages);
  if (
    !Number.isInteger(total) ||
    total < 0 ||
    !Number.isInteger(totalPages) ||
    totalPages < 0 ||
    !Array.isArray(first.data) ||
    Number(meta?.page) !== 1 ||
    (total > 0 && totalPages < 1)
  ) {
    throw new Error('Invalid product catalog pagination');
  }

  const pages = [first];
  const concurrency = 5;
  for (let start = 2; start <= totalPages; start += concurrency) {
    const count = Math.min(concurrency, totalPages - start + 1);
    const batch = await Promise.all(
      Array.from({ length: count }, (_, offset) => fetchPage(start + offset)),
    );
    batch.forEach((page, offset) => {
      if (
        !Array.isArray(page.data) ||
        Number(page.pagination?.page) !== start + offset ||
        Number(page.pagination?.total) !== total ||
        Number(page.pagination?.totalPages) !== totalPages
      ) {
        throw new Error('Product catalog changed or returned an invalid page');
      }
    });
    pages.push(...batch);
  }

  const products = pages.flatMap(page => page.data);
  if (
    products.length !== total ||
    new Set(products.map(product => product.id)).size !== total
  ) {
    throw new Error('Incomplete or inconsistent product catalog');
  }
  return pages;
}
