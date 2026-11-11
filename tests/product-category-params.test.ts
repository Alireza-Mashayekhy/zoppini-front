import assert from 'node:assert/strict';
import { test } from 'node:test';

import { productCategoryParams } from '../lib/product-category-params';

test('invalid paging and sorting cannot reach the backend as NaN or negative limits', () => {
  const params = productCategoryParams(
    { page: 'NaN', limit: '-1', sort: 'bad' },
    7,
  );
  assert.equal(params.page, 1);
  assert.equal(params.limit, 24);
  assert.equal(params.sort, 'createdAt:desc');
  assert.deepEqual(params.categoryIds, [7]);
});
test('repeated filters are supported without calling split on an array', () => {
  const params = productCategoryParams(
    {
      page: ['2', '3'],
      limit: '50',
      colorIds: ['2,2,3,-1,NaN', '4'],
      sizeIds: '1,0,1.2',
      search: ['پیراهن', 'کت'],
      sort: 'price:asc',
    },
    8,
  );
  assert.equal(params.page, 2);
  assert.equal(params.limit, 50);
  assert.equal(params.search, 'پیراهن');
  assert.equal(params.sort, 'price:asc');
  assert.deepEqual(params.colorIds, [2, 3]);
  assert.deepEqual(params.sizeIds, [1]);
});
test('oversized limits and fractional pages use safe defaults', () => {
  const params = productCategoryParams({ page: '1.5', limit: '999999999' }, 1);
  assert.equal(params.page, 1);
  assert.equal(params.limit, 24);
});
