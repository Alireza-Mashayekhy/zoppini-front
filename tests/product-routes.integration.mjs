// Run after npm run build: node --test tests/product-routes.integration.mjs
// Synthetic API only; never sends traffic to production.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';

const api = createServer((req, res) => {
  const url = new URL(req.url, 'http://fixture');
  res.setHeader('Content-Type', 'application/json');
  const send = (data, status = 200) => {
    res.statusCode = status;
    res.end(
      JSON.stringify({
        status,
        data,
        pagination: { page: 1, limit: 24, total: 0, totalPages: 0 },
      }),
    );
  };
  if (url.pathname === '/api/categories') return send([]);
  if (url.pathname === '/api/seo/redirects') return send([]);
  if (url.pathname === '/api/seo/page') return send(null);
  if (url.pathname === '/api/products/missing') return send(null, 404);
  if (url.pathname === '/api/products/failure') return send(null, 500);
  if (url.pathname === '/api/products/partial-colors')
    return send({
      product: {
        id: 2,
        title: 'محصول رنگی',
        slug: 'partial-colors',
        productCode: 'y',
        description: '',
        image: '/footer/enamd_1.webp',
        categories: [],
        colorImages: [],
        variants: [
          {
            id: 2,
            price: 100000,
            stock: 1,
            color: { id: 1, name: 'آبی', hexCode: '#00f' },
            size: null,
          },
        ],
        suggestedProducts: [],
        sameColorProducts: [
          {
            slug: 'another',
            colorImages: null,
            variants: [
              { color: { id: 2, name: 'قرمز', hexCode: '#f00' }, size: null },
            ],
          },
        ],
      },
      relatedProducts: [],
    });
  if (url.pathname === '/api/products/incomplete')
    return send({
      product: {
        id: 1,
        title: 'محصول آزمایشی',
        slug: 'incomplete',
        productCode: 'x',
        description: '',
        image: '',
        categories: [],
        colorImages: null,
        variants: [{ id: 1, price: null, stock: 0, color: null, size: null }],
        suggestedProducts: [],
        sameColorProducts: [],
      },
      relatedProducts: [],
    });
  return send(null, 404);
});
let next,
  origin,
  logs = '';
before(async () => {
  api.listen(0, '127.0.0.1');
  await once(api, 'listening');
  const probe = createServer().listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  origin = `http://127.0.0.1:${port}`;
  next = spawn(
    process.execPath,
    [
      'node_modules/next/dist/bin/next',
      'start',
      '-H',
      '127.0.0.1',
      '-p',
      String(port),
    ],
    {
      env: {
        ...process.env,
        API_URL: `http://127.0.0.1:${api.address().port}/api`,
        NEXT_PUBLIC_IMAGE_URL: '',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Next startup timed out: ${logs}`)),
      20000,
    );
    const onOutput = chunk => {
      logs += chunk;
      if (logs.includes('Ready in')) {
        clearTimeout(timer);
        resolve();
      }
    };
    next.stdout.on('data', onOutput);
    next.stderr.on('data', onOutput);
    next.once('exit', code => {
      clearTimeout(timer);
      reject(new Error(`Next exited ${code}: ${logs}`));
    });
  });
});
after(async () => {
  if (next && next.exitCode === null) {
    next.kill('SIGTERM');
    await once(next, 'exit');
  }
  await new Promise(resolve => api.close(resolve));
});

test('incomplete optional relationships do not crash SSR or advertise a fabricated price', async () => {
  const res = await fetch(`${origin}/product/incomplete`);
  const html = await res.text();
  assert.equal(res.status, 200, logs);
  assert.match(html, /محصول آزمایشی/);
  assert.match(html, /قیمت در دسترس نیست/);
  assert.match(html, /https:\/\/zoppinico.com\/product\/incomplete/);
  assert.doesNotMatch(html, /"offers":/);
});

test('partial color relations and absent sizes render without throwing', async () => {
  const res = await fetch(`${origin}/product/partial-colors`);
  const html = await res.text();
  assert.equal(res.status, 200, logs);
  assert.match(html, /محصول رنگی/);
  assert.match(html, /۱۰۰٬۰۰۰/);
});

test('repeated low-concurrency fixture requests remain responsive', async () => {
  for (let i = 0; i < 5; i++) {
    const responses = await Promise.all(
      Array.from({ length: 4 }, () => fetch(`${origin}/product/incomplete`)),
    );
    for (const res of responses) {
      assert.equal(res.status, 200, logs);
      await res.text();
    }
  }
});

test('product API 404 resolves to the not-found boundary', async t => {
  const res = await fetch(`${origin}/product/missing`);
  const html = await res.text();
  t.diagnostic(`HTTP ${res.status}`);
  // Next can stream its layout before notFound resolves.
  assert.ok(
    res.status === 404 ||
      (res.status === 200 && html.includes('NEXT_HTTP_ERROR_FALLBACK;404')),
    `status ${res.status}`,
  );
});

test('backend failure is not treated as a missing product', async t => {
  const res = await fetch(`${origin}/product/failure`);
  const html = await res.text();
  t.diagnostic(`HTTP ${res.status}`);
  assert.ok(
    res.status === 500 ||
      (res.status === 200 &&
        /NEXT_STREAMING_ERROR|An error occurred in the Server Components render/.test(
          html,
        )),
    `status ${res.status}`,
  );
  assert.doesNotMatch(html, /NEXT_HTTP_ERROR_FALLBACK;404/);
});

test('dashboard login redirects remain temporary and retain callback', async () => {
  for (const path of ['/dashboard/club', '/dashboard/orders']) {
    const res = await fetch(`${origin}${path}`, { redirect: 'manual' });
    assert.equal(res.status, 307);
    const location = new URL(res.headers.get('location'), origin);
    assert.equal(location.pathname, '/login');
    assert.equal(location.searchParams.get('callbackUrl'), path);
  }
});
