import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isTransientError,
  scanProductPages,
} from '../lib/blackfriday/catalog-scan';
import type { ApiListResponse } from '../services/api/types';
import type { ProductsResponse } from '../services/features/products/type';

const silent = { warn: () => {}, error: () => {} };
const noSleep = async () => {};
const fast = { sleep: noSleep, logger: silent };

function response(
  page: number,
  total = 181,
  limit = 24,
): ApiListResponse<ProductsResponse> {
  const data = Array.from(
    { length: Math.max(0, Math.min(limit, total - (page - 1) * limit)) },
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

function httpError(status: number) {
  return Object.assign(new Error(`Request failed: ${status}`), { status });
}

/**
 * Offset-paginated in-stock listing like `/products/discounted`, ordered by
 * createdAt DESC, id DESC. `onRequest` may mutate the id list between
 * requests to simulate orders selling out products mid-scan.
 */
function liveListing(
  count: number,
  limit: number,
  onRequest?: (request: number, ids: number[]) => number[],
) {
  let ids = Array.from({ length: count }, (_, i) => 10_000 - i);
  let requests = 0;
  const fetchPage = async (page: number) => {
    requests += 1;
    if (onRequest) ids = onRequest(requests, ids);
    const total = ids.length;
    return {
      status: 200,
      message: 'success',
      stats: null,
      data: ids
        .slice((page - 1) * limit, page * limit)
        .map(id => ({ id }) as ProductsResponse),
      // The real API serializes page/limit as strings.
      pagination: {
        page: String(page) as unknown as number,
        limit: String(limit) as unknown as number,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  };
  return { fetchPage, ids: () => ids, requests: () => requests };
}

test('catalog scan reads every API page in order and keeps every product', async () => {
  const requests: number[] = [];
  const result = await scanProductPages(async page => {
    requests.push(page);
    return response(page);
  }, fast);
  assert.deepEqual(
    [...requests].sort((a, b) => a - b),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
  assert.deepEqual(
    result.products.map(product => product.id),
    Array.from({ length: 181 }, (_, i) => i + 1),
  );
  assert.equal(result.consistent, true);
  assert.equal(result.requests, 8);
});

test('accepts the API pagination page and limit when serialized as strings', async () => {
  const result = await scanProductPages(async page => {
    const page27 = response(page, 27);
    page27.pagination.page = String(page) as unknown as number;
    page27.pagination.limit = '24' as unknown as number;
    return page27;
  }, fast);
  assert.equal(result.products.length, 27);
});

test('an empty catalog is a valid, consistent result', async () => {
  const result = await scanProductPages(async () => response(1, 0), fast);
  assert.equal(result.products.length, 0);
  assert.equal(result.consistent, true);
});

test('transient page failures (429, 5xx, network) are retried instead of discarding the catalog', async () => {
  const failures = new Map<number, unknown[]>([
    [3, [httpError(429)]],
    [5, [httpError(502), new TypeError('fetch failed')]],
  ]);
  const delays: number[] = [];
  const result = await scanProductPages(
    async page => {
      const pending = failures.get(page);
      if (pending?.length) throw pending.shift();
      return response(page);
    },
    {
      logger: silent,
      sleep: async ms => {
        delays.push(ms);
      },
    },
  );
  assert.equal(result.products.length, 181);
  assert.equal(result.requests, 8 + 3);
  // 429 backs off longer than a 5xx/network error.
  assert.ok(delays.some(ms => ms >= 1600));
});

test('a page that keeps failing fails the scan – a missing page is never returned as the catalog', async () => {
  await assert.rejects(
    scanProductPages(async page => {
      if (page === 7) throw httpError(503);
      return response(page);
    }, fast),
    /503/,
  );
});

test('non-transient errors are not retried', async () => {
  let calls = 0;
  await assert.rejects(
    scanProductPages(async page => {
      calls += 1;
      if (page === 1) throw httpError(404);
      return response(page);
    }, fast),
  );
  assert.equal(calls, 1);
  assert.equal(isTransientError(httpError(404)), false);
  assert.equal(isTransientError(httpError(429)), true);
  assert.equal(isTransientError(new TypeError('fetch failed')), true);
});

test('invalid pagination on a page is retried, then fails the scan', async () => {
  let calls = 0;
  await assert.rejects(
    scanProductPages(async () => {
      calls += 1;
      return { data: null } as unknown as ApiListResponse<ProductsResponse>;
    }, fast),
    /Invalid product page/,
  );
  assert.equal(calls, 3);
});

test('REGRESSION: a product selling out mid-scan no longer empties the 1,046-product sale catalog', async () => {
  // Production numbers: /products/discounted reported total 1046.
  // Request 6 = a customer buys the last unit of a product on page 1.
  const listing = liveListing(1046, 100, (request, ids) =>
    request === 6 ? ids.filter(id => id !== 9_990) : ids,
  );
  const result = await scanProductPages(listing.fetchPage, fast);

  // Drift detected → one rescan → consistent second pass.
  assert.equal(result.passes, 2);
  assert.equal(result.consistent, true);
  assert.equal(result.products.length, 1045);
  assert.ok(!result.products.some(product => product.id === 9_990));
  assert.equal(new Set(result.products.map(p => p.id)).size, 1045);
});

test('REGRESSION: when the listing keeps changing, the union of passes is returned instead of nothing', async () => {
  // A product sells out on every 4th request – never a quiet window.
  const sold: number[] = [];
  const listing = liveListing(1046, 100, (request, ids) => {
    if (request % 4 !== 0) return ids;
    const victim = ids[request % ids.length];
    sold.push(victim);
    return ids.filter(id => id !== victim);
  });
  const result = await scanProductPages(listing.fetchPage, fast);

  assert.equal(result.consistent, false);
  assert.equal(result.passes, 2);
  // Every product that is still in stock is present (none lost to shifting).
  const got = new Set(result.products.map(product => product.id));
  for (const id of listing.ids()) assert.ok(got.has(id), `missing ${id}`);
  // No duplicates, and nothing beyond the original catalog.
  assert.equal(got.size, result.products.length);
  assert.ok(result.products.length <= 1046);
});

test('production-sized scan uses ~4× fewer backend requests with 100-row pages', async () => {
  const at24 = liveListing(1046, 24);
  const at100 = liveListing(1046, 100);
  await scanProductPages(at24.fetchPage, fast);
  await scanProductPages(at100.fetchPage, fast);
  assert.equal(at24.requests(), 44);
  assert.equal(at100.requests(), 11);
});
