import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createProductListState,
  normalizePagination,
  productListReducer,
  shouldLoadPage,
} from '../lib/blackfriday/pagination';
import type { ProductsResponse } from '../services/features/products/type';
import {
  buildProductsQuery,
  type InfiniteProductQuery,
} from '../lib/hooks/use-infinite-products';

test('pagination is normalised from the real API response', () => {
  assert.deepEqual(
    normalizePagination(
      { page: 2, limit: 24, total: 45, totalPages: 2 },
      1,
    ),
    { page: 2, limit: 24, total: 45, totalPages: 2, hasMore: false },
  );

  assert.deepEqual(
    normalizePagination(
      { page: 1, limit: 24, total: 45, totalPages: 2 },
      1,
    ),
    { page: 1, limit: 24, total: 45, totalPages: 2, hasMore: true },
  );
});

test('a partial or broken pagination never loops forever', () => {
  const empty = normalizePagination(undefined, 3);
  assert.equal(empty.page, 3);
  assert.equal(empty.totalPages, 3);
  assert.equal(empty.hasMore, false);

  const backwards = normalizePagination({ page: 4, totalPages: 2 }, 1);
  assert.equal(backwards.page, 4);
  assert.equal(backwards.totalPages, 4);
  assert.equal(backwards.hasMore, false);

  const negative = normalizePagination({ page: -5, totalPages: -1 }, 1);
  assert.equal(negative.page, 1);
  assert.equal(negative.totalPages, 1);
  assert.equal(negative.hasMore, false);
});

test('the next page is requested once, and only while pages remain', () => {
  assert.equal(shouldLoadPage({ page: 1, totalPages: 3, loading: false }), true);
  assert.equal(shouldLoadPage({ page: 3, totalPages: 3, loading: false }), false);
  assert.equal(shouldLoadPage({ page: 1, totalPages: 3, loading: true }), false);
  assert.equal(shouldLoadPage({ page: 0, totalPages: 1, loading: false }), true);
});

test('infinite scroll builds the same query as the storefront listing', () => {
  const query: InfiniteProductQuery = {
    categoryIds: [137],
    sort: 'createdAt:desc',
    limit: 24,
  };

  const params = new URLSearchParams(buildProductsQuery(query, 2));

  assert.equal(params.get('page'), '2');
  assert.equal(params.get('limit'), '24');
  assert.equal(params.get('categoryIds'), '137');
  assert.equal(params.get('sort'), 'createdAt:desc');
  // پارامترهایی که API با آن‌ها فیلتر نمی‌کند هرگز فرستاده نمی‌شوند
  assert.equal(params.get('category'), null);
  assert.equal(params.get('categorySlug'), null);
});

test('category filter keeps the campaign category active', () => {
  const query: InfiniteProductQuery = {
    categoryIds: [137, 140],
    sort: 'price:asc',
    limit: 24,
  };

  const params = new URLSearchParams(buildProductsQuery(query, 1));

  assert.equal(params.get('categoryIds'), '137,140');
  assert.equal(params.get('sort'), 'price:asc');
});

function product(id: number): ProductsResponse {
  return {
    id,
    title: `محصول ${id}`,
    slug: `product-${id}`,
    image: `images/${id}.webp`,
    variants: [{ id, price: 100000, stock: 1 }],
    categories: [],
  } as unknown as ProductsResponse;
}

test('infinite list appends API pages without duplicate products', () => {
  let state = createProductListState({
    items: [product(1), product(2)],
    pagination: { page: 1, limit: 24, total: 3, totalPages: 2 },
  });

  assert.equal(state.page, 1);
  assert.equal(state.totalPages, 2);
  assert.equal(state.page < state.totalPages, true);

  state = productListReducer(state, { type: 'request-start' });
  assert.equal(state.loading, true);

  // صفحهٔ دوم دادهٔ تکراری هم برمی‌گرداند (مثلاً محصول تازه‌اضافه‌شده)
  state = productListReducer(state, {
    type: 'page-loaded',
    incoming: [product(2), product(3)],
    page: 2,
    totalPages: 2,
    reset: false,
  });

  assert.deepEqual(
    state.items.map(item => item.id),
    [1, 2, 3],
  );
  assert.equal(state.page, 2);
  assert.equal(state.loading, false);
  assert.equal(state.page < state.totalPages, false, 'end of list detected');
  assert.equal(shouldLoadPage({ page: state.page, totalPages: state.totalPages, loading: false }), false);
});

test('changing sort or filter resets the list before page one arrives', () => {
  let state = createProductListState({
    items: [product(1), product(2), product(3)],
    pagination: { page: 3, limit: 24, total: 60, totalPages: 3 },
  });

  state = productListReducer(state, { type: 'query-changed' });

  assert.deepEqual(state.items, []);
  assert.equal(state.page, 0);
  assert.equal(state.loading, true);
  assert.equal(
    shouldLoadPage({ page: state.page, totalPages: state.totalPages, loading: false }),
    true,
  );

  state = productListReducer(state, {
    type: 'page-loaded',
    incoming: [product(9)],
    page: 1,
    totalPages: 1,
    reset: true,
  });

  assert.deepEqual(state.items.map(item => item.id), [9]);
  assert.equal(state.page, 1);
  assert.equal(state.totalPages, 1);
});

test('a failed page never advances the pagination, so it can be retried', () => {
  let state = createProductListState({
    items: [product(1)],
    pagination: { page: 1, limit: 24, total: 48, totalPages: 2 },
  });

  state = productListReducer(state, { type: 'request-start' });
  state = productListReducer(state, { type: 'request-failed' });

  assert.equal(state.failed, true);
  assert.equal(state.loading, false);
  assert.equal(state.page, 1);
  assert.deepEqual(state.items.map(item => item.id), [1]);
  assert.equal(
    shouldLoadPage({ page: state.page, totalPages: state.totalPages, loading: false }),
    true,
    'the failed page can be requested again',
  );
});
