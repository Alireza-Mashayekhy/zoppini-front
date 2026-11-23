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
  // دستهٔ واقعی کمپین و پنج زیردستهٔ آن (همان شناسه/اسلاگ فروشگاه)
  { id: 137, name: 'زوپینی بلک فرایدی', slug: 'zoppini-black-friday', parentId: null },
  { id: 138, name: 'پیراهن کلاسیک', slug: 'mens-classic-shirts', parentId: 137 },
  { id: 139, name: 'پیراهن کژوال', slug: 'mens-casual-shirts', parentId: 137 },
  { id: 140, name: 'شلوار', slug: 'mens-trousers', parentId: 137 },
  { id: 141, name: 'کت تک', slug: 'mens-blazers', parentId: 137 },
  { id: 142, name: 'پالتو', slug: 'mens--coats', parentId: 137 },
].map(item => ({
  description: '<p>توضیح آزمایشی</p>',
  isActive: true,
  image: '',
  ...item,
}));
/**
 * محصولات آزمایشی کمپین (۲۷ عدد → دو صفحهٔ ۲۴تایی).
 *
 * چند محصول بدون موجودی و با تخفیف بالا هم عمداً هست تا رفتار «فقط محصول
 * موجود» در مسیر واقعی بررسی شود؛ API عمومی فروشگاه این‌ها را برنمی‌گرداند.
 */
const blackFridaySubcategories = [
  { id: 138, name: 'پیراهن کلاسیک', slug: 'mens-classic-shirts' },
  { id: 139, name: 'پیراهن کژوال', slug: 'mens-casual-shirts' },
  { id: 140, name: 'شلوار', slug: 'mens-trousers' },
  { id: 141, name: 'کت تک', slug: 'mens-blazers' },
  { id: 142, name: 'پالتو', slug: 'mens--coats' },
];
const blackFridayProducts = Array.from({ length: 27 }, (_, index) => {
  const subcategory = blackFridaySubcategories[index % 5];
  const id = 1000 + index;
  const price = 1000000 + index * 100000;
  const percent = index < 4 ? 70 : index === 4 ? 90 : index === 6 ? 75 : 20;
  const finalPrice = Math.round(price * (1 - percent / 100));
  const stock = index === 4 || index === 6 ? 0 : 2;

  return {
    id,
    productCode: `BF-${id}`,
    title: `محصول بلک فرایدی ${index + 1}`,
    slug: `black-friday-product-${index + 1}`,
    image: '/test.webp',
    description: '',
    careInstructionsHtml: '',
    createdAt: `2026-11-${String(10 + (index % 10)).padStart(2, '0')}T00:00:00.000Z`,
    updatedAt: '2026-11-10T00:00:00.000Z',
    suggestedProducts: [],
    comments: [],
    colorImages: [],
    sameColorProducts: [],
    categories: [subcategory, { id: 137, name: 'زوپینی بلک فرایدی', slug: 'zoppini-black-friday' }],
    variants: [
      {
        id,
        price,
        stock,
        color: { id: 1, name: 'مشکی', hexCode: '#000000' },
        size: { id: 1, name: 'M' },
      },
    ],
    discount: {
      id: 7,
      code: null,
      title: null,
      type: 'percentage',
      value: percent,
      maxDiscountAmount: null,
      discountAmount: price - finalPrice,
      originalPrice: price,
      finalPrice,
      expiresAt: '2026-11-30T20:30:00.000Z',
      stages: [],
      stacked: false,
      effectivePercent: percent,
    },
  };
});

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
    const requestedCategories = (url.searchParams.get('categoryIds') || '')
      .split(',')
      .filter(Boolean);
    if (requestedCategories.includes('137')) {
      const page = Number(url.searchParams.get('page') || 1);
      const limit = Number(url.searchParams.get('limit') || 24);
      // همان قاعدهٔ API عمومی: فقط محصولاتی که واریانت موجود دارند
      const inStock = blackFridayProducts.filter(product =>
        product.variants.some(variant => Number(variant.stock) > 0),
      );
      const requestedSubcategories = requestedCategories.filter(
        id => id !== '137',
      );
      const filtered = requestedSubcategories.length
        ? inStock.filter(product =>
            product.categories.some(category =>
              requestedSubcategories.includes(String(category.id)),
            ),
          )
        : inStock;
      const slice = filtered.slice((page - 1) * limit, page * limit);
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          status: 200,
          data: slice,
          pagination: {
            page,
            limit,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / limit),
          },
        }),
      );
      return;
    }
    return send(
      requestedCategories.includes('1')
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
  assert.match(html, /href="\/landing\/blackfriday"[^>]*>بلک فرایدی<\/a>/);
});

test('Black Friday landing replaces the old page and keeps the storefront shell', async () => {
  const before = requests.length;
  const { res, html } = await page('/landing/blackfriday');
  assert.equal(res.status, 200, logs);
  assert.match(res.headers.get('cache-control') ?? '', /no-store/);

  // پوستهٔ واقعی سایت: هدر/فوتر مشترک، بدون هدر یا فوتر دوم
  assert.match(html, /<main[^>]*dir="rtl"/);
  assert.match(html, /<header class="w-full bg-background/);
  assert.equal((html.match(/<header class="w-full bg-background/g) ?? []).length, 1);
  assert.equal((html.match(/aria-label="ناوبری موبایل"/g) ?? []).length, 1);
  assert.match(html, /<footer[^>]*id="site-footer"/);
  assert.equal((html.match(/<footer[^>]*id="site-footer"/g) ?? []).length, 1);
  assert.match(html, /href="\/landing\/blackfriday"/);

  // بخش‌های تأییدشده، به همان ترتیب
  assert.match(html, /بیشترین تخفیف‌ها/);
  assert.match(html, /تا ۷۰٪ تخفیف/);
  assert.match(html, /تا آخرین لحظه بلک‌فرایدی/);
  assert.match(html, /role="timer"/);
  assert.match(html, /خرید بر اساس دسته‌بندی/);
  assert.match(html, /تمام محصولات بلک‌فرایدی/);
  const order = [
    /aria-label="کمپین بلک فرایدی زوپینی"/,
    /aria-labelledby="discounts-heading"/,
    /aria-labelledby="countdown-heading"/,
    /aria-labelledby="categories-heading"/,
    /id="collection"/,
  ].map(pattern => html.search(pattern));
  assert.ok(order.every(index => index > -1), order.join(','));
  assert.deepEqual([...order].sort((a, b) => a - b), order);

  // کارت محصولِ مشترک فروشگاه، با محصولات واقعیِ همین API
  assert.match(html, /data-product-card/);
  assert.match(html, /href="\/product\/black-friday-product-1"/);
  assert.match(html, /محصول بلک فرایدی 1/);
  assert.match(html, /href="\/product\/black-friday-product-24"/);

  // صفحهٔ اول (۲۴ محصول) محتوای اولیهٔ بند محصولات است؛ صفحهٔ بعد هنگام
  // اسکرول از کلاینت خوانده می‌شود و در HTML اولیه نمی‌آید.
  const collectionSection = html.slice(html.indexOf('id="collection"'));
  assert.equal(
    (collectionSection.match(/data-product-card/g) ?? []).length,
    24,
  );
  // (محصول‌های صفحهٔ دوم فقط در بخش «بیشترین تخفیف‌ها» ممکن است دیده شوند،
  // چون رتبه‌بندی از کل دستهٔ خوانده‌شده انتخاب می‌شود.)

  // محصولات ناموجود (طبق قاعدهٔ فروشگاه) در هیچ بخشی نمی‌آیند
  assert.doesNotMatch(html, /محصول بلک فرایدی 5</);
  assert.doesNotMatch(html, /محصول بلک فرایدی 7</);

  // دقیقاً شش محصول در بخش «بیشترین تخفیف‌ها» (موبایل چهارتای اول را CSS
  // نشان می‌دهد و بقیه را پنهان می‌کند)
  const discountsSection = html.slice(
    html.indexOf('aria-labelledby="discounts-heading"'),
    html.indexOf('id="countdown-heading"'),
  );
  assert.equal((discountsSection.match(/data-product-card/g) ?? []).length, 6);

  // کاشی دسته‌ها به مسیرهای واقعی فروشگاه لینک می‌دهد
  for (const slug of [
    'mens-classic-shirts',
    'mens-casual-shirts',
    'mens-trousers',
    'mens-blazers',
    'mens--coats',
  ]) {
    assert.match(html, new RegExp(`href="/product-category/${slug}"`));
  }

  // بدون ارجاع به سورس استندالون یا فونت‌های کمپین قبلی
  assert.doesNotMatch(html, /landing-blackfriday/);
  const preload = `${html} ${res.headers.get('link') ?? ''}`;
  assert.doesNotMatch(preload, /Vazir|cormorant|oswald/);

  // دارایی‌های تأییدشده از مسیر نهایی و با بهینه‌سازی next/image
  assert.match(html, /campaign%2Fblackfriday%2Fhero-banner-desktop\.png/);
  assert.match(html, /campaign%2Fblackfriday%2Fhero-banner-mobile\.png/);
  // پوستر تأییدشده تنها محتوای دیداری هیرو است؛ تیتر ساختاری صفحه هم هست
  assert.match(html, /<h1[^>]*>[^<]*بلک‌فرایدی زوپینی[^<]*<\/h1>/);
  for (const image of [
    'category-classic-shirts',
    'category-casual-shirts',
    'category-trousers',
    'category-blazers',
    'category-coats',
  ]) {
    assert.match(html, new RegExp(`campaign%2Fblackfriday%2F${image}\\.jpg`));
  }

  const css = html.match(/href="(\/_next\/static\/[^" ]+\.css)"/);
  const script = html.match(/src="(\/_next\/static\/[^" ]+\.js)"/);
  assert.ok(css && script, 'SSR links to the compiled CSS and JS assets');

  const assets = [
    ['/campaign/blackfriday/hero-banner-desktop.png', /image\/png/],
    ['/campaign/blackfriday/hero-banner-mobile.png', /image\/png/],
    ['/campaign/blackfriday/og-blackfriday.jpg', /image\/jpeg/],
    ['/campaign/blackfriday/category-classic-shirts.jpg', /image\/jpeg/],
    [
      `/_next/image?url=${encodeURIComponent('/campaign/blackfriday/hero-banner-desktop.png')}&w=1920&q=75`,
      /image\//,
    ],
    [css[1], /text\/css/],
    [script[1], /javascript/],
  ];

  for (const [path, contentType] of assets) {
    const asset = await fetch(`${origin}${path}`);
    assert.equal(asset.status, 200, path);
    assert.match(asset.headers.get('content-type') ?? '', contentType, path);
    assert.ok((await asset.arrayBuffer()).byteLength > 0, path);
  }
});

test('Black Friday products come from category 137 across every API page', async () => {
  const before = requests.length;
  const { res } = await page('/landing/blackfriday');
  assert.equal(res.status, 200, logs);

  const productRequests = requests
    .slice(before)
    .filter(url => url.startsWith('/api/products?'));

  assert.ok(productRequests.length >= 2, productRequests.join('\n'));
  assert.ok(
    productRequests.some(
      url =>
        url.includes('categoryIds=137') &&
        url.includes('limit=24') &&
        url.includes('page=1'),
    ),
    productRequests.join('\n'),
  );
  // رتبه‌بندی «بیشترین تخفیف» فقط از صفحهٔ اول نیست
  assert.ok(
    productRequests.some(
      url => url.includes('categoryIds=137') && url.includes('page=2'),
    ),
    productRequests.join('\n'),
  );
  // پارامترهایی که API با آن‌ها فیلتر نمی‌کند هرگز فرستاده نمی‌شوند
  assert.ok(
    productRequests.every(
      url => !/[?&]category=/.test(url) && !url.includes('categorySlug='),
    ),
    productRequests.join('\n'),
  );
});
