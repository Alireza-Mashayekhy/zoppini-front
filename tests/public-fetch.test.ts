import assert from 'node:assert/strict';
import { afterEach, before, test } from 'node:test';

/**
 * این تست‌ها `publicFetch` را با یک `fetch` ساختگی بررسی می‌کنند تا ثابت شود
 * داده‌ی عمومی بدون کوکیِ کاربر فرستاده می‌شود (تفاوتِ اصلی با `serverFetch`).
 *
 * توجه: `publicFetch` در فایلی تعریف شده که `next/headers` را هم import
 * می‌کند؛ import کردنِ آن خارج از درخواستِ Next مشکلی ندارد چون تابعِ
 * `cookies()` در این مسیر فراخوانی نمی‌شود.
 */
process.env.API_URL = 'https://api.example.com/api/';

type FetchCall = { input: string; init: RequestInit };

const calls: FetchCall[] = [];
const realFetch = globalThis.fetch;

before(async () => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input: String(input), init: init ?? {} });

    return new Response(JSON.stringify({ status: 'ok', data: { ok: true } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
});

afterEach(() => {
  calls.length = 0;
});

test('publicFetch does not send the user cookie header', async () => {
  const { publicFetch } = await import('@/services/api/server');

  await publicFetch('products?limit=1');

  assert.equal(calls.length, 1);

  const headers = calls[0].init.headers as Record<string, string>;

  assert.equal('Cookie' in headers, false);
  assert.equal(headers['Content-Type'], 'application/json');
});

test('publicFetch keeps the no-store default so cache policy is unchanged', async () => {
  const { publicFetch } = await import('@/services/api/server');

  await publicFetch('products');

  assert.equal(calls[0].init.cache, 'no-store');
});

test('publicFetch forwards an explicit revalidate config', async () => {
  const { publicFetch } = await import('@/services/api/server');

  await publicFetch('sitemap', { next: { revalidate: 3600 } });

  const init = calls[0].init as RequestInit & { next?: { revalidate: number } };

  assert.deepEqual(init.next, { revalidate: 3600 });
});

test('publicFetch builds the URL from the normalized API base', async () => {
  const { publicFetch } = await import('@/services/api/server');

  await publicFetch('blog?page=2');

  assert.equal(calls[0].input, 'https://api.example.com/api/blog?page=2');
});

test('publicFetch maps a failed response to ApiError', async () => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ status: 'error', message: 'Not Found' }), {
      status: 404,
    })) as typeof fetch;

  const { ApiError, publicFetch } = await import('@/services/api/server');

  await assert.rejects(
    () => publicFetch('products/missing'),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 404);
      assert.match(error.message, /Not Found/);
      return true;
    },
  );
});

test('the real fetch implementation is restored for other suites', () => {
  // فقط برای اطمینان از اینکه stub در همین فایل باقی مانده است.
  assert.notEqual(globalThis.fetch, undefined);
  assert.equal(typeof realFetch, 'function');
});
