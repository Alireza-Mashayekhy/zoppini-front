// Run after `npm run build`: node --test tests/category-routes.integration.mjs
// A local API fixture isolates route behavior; no production data is touched.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';
import { once } from 'node:events';

const requests = [];
const categories = [
  { id: 1, name: 'دسته والد', slug: 'پوشاک', parentId: null },
  { id: 2, name: 'دسته فرزند', slug: 'پیراهن', parentId: 1 },
  { id: 3, name: 'غیرفعال', slug: 'inactive', parentId: null, isActive: false },
  { id: 4, name: 'اسلاگ ویژه', slug: 'special?#%', parentId: null },
].map(item => ({
  description: '<p>توضیح آزمایشی</p>',
  isActive: true,
  image: '',
  ...item,
}));
const api = createServer((req, res) => {
  const url = new URL(req.url, 'http://fixture');
  requests.push(url.pathname + url.search);
  res.setHeader('Content-Type', 'application/json');
  const send = (data, status = 200) => {
    res.statusCode = status;
    res.end(
      JSON.stringify({
        status,
        data,
        pagination: { page: 1, total: 0, totalPages: 1, limit: 24 },
      }),
    );
  };
  if (url.pathname === '/api/categories')
    return send(categories.filter(item => item.isActive));
  if (url.pathname.startsWith('/api/categories/slug/')) {
    const slug = decodeURIComponent(
      url.pathname.slice('/api/categories/slug/'.length),
    );
    const category = categories.find(item => item.slug === slug);
    return send(category ?? null, category ? 200 : 404);
  }
  if (url.pathname === '/api/products') {
    return send(
      url.searchParams.get('categoryIds') === '1'
        ? [
            {
              id: 10,
              title: 'محصول آزمایشی',
              slug: 'example-product',
              image: '/test.webp',
              variants: [{ price: 100000 }],
            },
          ]
        : [],
    );
  }
  if (url.pathname === '/api/seo/redirects') return send([]);
  if (url.pathname === '/api/seo/page') return send(null);
  return send(null, 404);
});
let next;
let origin;
let logs = '';
before(async () => {
  api.listen(0, '127.0.0.1');
  await once(api, 'listening');
  const portProbe = createServer();
  portProbe.listen(0, '127.0.0.1');
  await once(portProbe, 'listening');
  const port = portProbe.address().port;
  await new Promise(resolve => portProbe.close(resolve));
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
    const output = chunk => {
      logs += chunk;
      if (logs.includes('Ready in')) {
        clearTimeout(timer);
        resolve();
      }
    };
    next.stdout.on('data', output);
    next.stderr.on('data', output);
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

async function page(path) {
  const res = await fetch(`${origin}${path}`, { redirect: 'manual' });
  return { res, html: await res.text() };
}
test('parent category landing renders via API base without trailing slash', async () => {
  const { res, html } = await page(`/category/${encodeURIComponent('پوشاک')}`);
  assert.equal(res.status, 200, logs);
  assert.match(html, /دسته والد/);
  assert.match(html, /دسته فرزند/);
  assert.match(html, /محصول آزمایشی/);
  assert.match(html, /توضیح آزمایشی/);
  assert.ok(requests.some(url => url.includes('directCategory=true')));
  assert.ok(
    requests.every(url => url.startsWith('/api/')),
    requests.join('\n'),
  );
});
test('leaf category redirects to its product listing', async () => {
  const { res } = await page(`/category/${encodeURIComponent('پیراهن')}`);
  assert.equal(res.status, 307, logs);
  assert.equal(
    decodeURIComponent(res.headers.get('location')),
    '/product-category/پیراهن',
  );
});
test('product category listing renders an empty result without crashing', async () => {
  const { res, html } = await page(
    `/product-category/${encodeURIComponent('پیراهن')}`,
  );
  assert.equal(res.status, 200, logs);
  assert.match(html, /دسته فرزند/);
  assert.match(html, /محصولی یافت نشد/);
  assert.match(html, /توضیح آزمایشی/);
});
test('special slug characters remain one encoded API path segment', async () => {
  const { res, html } = await page(
    `/product-category/${encodeURIComponent('special?#%')}`,
  );
  assert.equal(res.status, 200, logs);
  assert.match(html, /اسلاگ ویژه/);
  assert.ok(requests.includes('/api/categories/slug/special%3F%23%25'));
});
for (const prefix of ['category', 'product-category']) {
  for (const slug of ['missing', 'inactive']) {
    test(`${prefix}/${slug} renders not-found rather than an API exception or all products`, async () => {
      const beforeProducts = requests.filter(url =>
        url.startsWith('/api/products?'),
      ).length;
      const { res, html } = await page(`/${prefix}/${slug}`);
      // Next may stream the shell before notFound resolves; assert the actual boundary too.
      assert.ok(
        res.status === 404 ||
          (res.status === 200 && html.includes('NEXT_HTTP_ERROR_FALLBACK;404')),
        `${res.status}: ${html.slice(-1000)}`,
      );
      assert.doesNotMatch(html, /محصولی یافت نشد/);
      assert.equal(
        requests.filter(url => url.startsWith('/api/products?')).length,
        beforeProducts,
      );
    });
  }
}

test('repeated and invalid filters cannot crash the category listing', async () => {
  const result = await page(
    `/product-category/${encodeURIComponent('پیراهن')}?page=NaN&limit=-1&colorIds=2&colorIds=3&sizeIds=oops`,
  );
  assert.equal(result.res.status, 200, logs);
  assert.match(result.html, /دسته فرزند/);
  assert.ok(
    requests.some(
      url => url.includes('page=1&limit=24') && url.includes('colorIds=2'),
    ),
  );
});

test('product category listing renders actual product cards', async () => {
  const { res, html } = await page(
    `/product-category/${encodeURIComponent('پوشاک')}`,
  );
  assert.equal(res.status, 200, logs);
  assert.match(html, /محصول آزمایشی/);
  assert.match(html, /example-product/);
});
