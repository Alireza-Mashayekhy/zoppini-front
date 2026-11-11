import { DEFAULT_PRODUCT_SORT, PRODUCT_SORT_OPTIONS } from './product-sort';

type QueryValue = string | string[] | undefined;
export type ProductCategorySearchParams = Record<string, QueryValue>;

const first = (value: QueryValue) => (Array.isArray(value) ? value[0] : value);
function positiveInteger(
  value: QueryValue,
  fallback: number,
  max = Number.MAX_SAFE_INTEGER,
) {
  const parsed = Number(first(value));
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= max
    ? parsed
    : fallback;
}
function ids(value: QueryValue): number[] {
  return [
    ...new Set(
      (first(value) || '')
        .split(',')
        .map(Number)
        .filter(id => Number.isSafeInteger(id) && id > 0),
    ),
  ];
}

/** URL search params are untrusted and may be repeated (string[] in Next). */
export function productCategoryParams(
  search: ProductCategorySearchParams,
  categoryId: number,
) {
  const requestedSort = first(search.sort);
  return {
    page: positiveInteger(search.page, 1),
    limit: positiveInteger(search.limit, 24, 100),
    search: first(search.search) || '',
    sort: PRODUCT_SORT_OPTIONS.some(option => option.value === requestedSort)
      ? requestedSort!
      : DEFAULT_PRODUCT_SORT,
    categoryIds: [categoryId],
    colorIds: ids(search.colorIds),
    sizeIds: ids(search.sizeIds),
  };
}
