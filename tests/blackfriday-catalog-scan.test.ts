import assert from 'node:assert/strict';
import { test } from 'node:test';

import { scanProductPages } from '../lib/blackfriday/catalog-scan';
import type { ApiListResponse } from '../services/api/types';
import type { ProductsResponse } from '../services/features/products/type';

function response(
  page: number,
  total = 181,
): ApiListResponse<ProductsResponse> {
  const limit = 24;
  const data = Array.from(
    { length: Math.min(limit, total - (page - 1) * limit) },
    (_, i) => ({ id: (page - 1) * limit + i + 1 }) as ProductsResponse,
  );
  return {
    data,
    pagination: { page, total, limit, totalPages: Math.ceil(total / limit) },
    status: 200,
    message: '',
    stats: null,
  };
}

test('catalog scan reads past five API pages in order and keeps every product', async () => {
  const requests: number[] = [];
  const pages = await scanProductPages(async page => {
    requests.push(page);
    return response(page);
  });
  assert.deepEqual(requests, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(
    pages.flatMap(page => page.data.map(product => product.id)),
    Array.from({ length: 181 }, (_, i) => i + 1),
  );
});

test('catalog scan refuses failed, duplicate, or changed pages instead of returning partial results', async () => {
  await assert.rejects(
    scanProductPages(async page => {
      if (page === 7) throw new Error('network');
      return response(page);
    }),
  );
  await assert.rejects(
    scanProductPages(async page => {
      const result = response(page);
      if (page === 7) result.data[0].id = 1;
      return result;
    }),
  );
  await assert.rejects(
    scanProductPages(async page =>
      page === 7 ? response(page, 182) : response(page),
    ),
  );
  const empty = await scanProductPages(async () => response(1, 0));
  assert.equal(empty[0].data.length, 0);
});

test('accepts the API pagination page and limit when serialized as strings', async () => {
  const pages = await scanProductPages(async page => {
    const result = response(page, 27);
    result.pagination.page = String(page) as unknown as number;
    result.pagination.limit = '24' as unknown as number;
    return result;
  });
  assert.equal(pages.flatMap(page => page.data).length, 27);
});
