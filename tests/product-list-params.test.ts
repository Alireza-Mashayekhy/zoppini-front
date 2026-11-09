import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import {
  buildNextPageQuery,
  buildProductListQuery,
  productQueriesEqual,
} from '../lib/product-list-params';
import { DEFAULT_PRODUCT_SORT } from '../lib/product-sort';

const source = (path: string) =>
  readFileSync(resolve(__dirname, '..', path), 'utf8');

test('search از آدرس «مشاهده همه نتایج» حذف نمی‌شود', () => {
  // همان سناریوی گزارش‌شده: /products?search=نیم زیپ نباید به
  // /products?sort=createdAt:desc بپرد.
  const current = new URLSearchParams({ search: 'نیم زیپ' }).toString();

  assert.equal(
    buildProductListQuery(current, {
      sort: DEFAULT_PRODUCT_SORT,
      colorIds: [],
      sizeIds: [],
    }),
    current,
  );
});

test('مرتب‌سازی پیش‌فرض در آدرس نوشته نمی‌شود', () => {
  assert.equal(
    buildProductListQuery(new URLSearchParams({ search: 'کت' }).toString(), {
      sort: 'createdAt:desc',
    }),
    'search=%DA%A9%D8%AA',
  );

  // ولی مرتب‌سازیِ انتخابی کاربر اضافه می‌شود و search هم می‌ماند.
  const query = buildProductListQuery(
    new URLSearchParams({ search: 'کت' }).toString(),
    { sort: 'price:asc' },
  );
  const params = new URLSearchParams(query);
  assert.equal(params.get('search'), 'کت');
  assert.equal(params.get('sort'), 'price:asc');
});

test('فیلترها و search با هم در آدرس می‌مانند', () => {
  const query = buildProductListQuery(
    new URLSearchParams({ search: 'پیراهن', sort: 'price:asc' }).toString(),
    { sort: DEFAULT_PRODUCT_SORT, colorIds: [3, 5], sizeIds: [1] },
  );
  const params = new URLSearchParams(query);

  assert.equal(params.get('search'), 'پیراهن');
  assert.equal(params.get('sort'), null);
  assert.equal(params.get('colorIds'), '3,5');
  assert.equal(params.get('sizeIds'), '1');
});

test('پاک کردن فیلترها فقط پارامترهای خودش را حذف می‌کند', () => {
  const query = buildProductListQuery(
    new URLSearchParams({
      search: 'شلوار',
      colorIds: '3,5',
      sizeIds: '1',
      page: '2',
    }).toString(),
    { sort: DEFAULT_PRODUCT_SORT, colorIds: [], sizeIds: [] },
  );
  const params = new URLSearchParams(query);

  assert.equal(params.get('search'), 'شلوار');
  assert.equal(params.get('colorIds'), null);
  assert.equal(params.get('sizeIds'), null);
  // page را وقتی page به تابع داده نشده دست نمی‌زنیم.
  assert.equal(params.get('page'), '2');
});

test('لینک «محصولات بیشتر» search را با خودش می‌برد', () => {
  const query = buildNextPageQuery({
    search: 'نیم زیپ',
    sort: DEFAULT_PRODUCT_SORT,
    page: 2,
  });
  const params = new URLSearchParams(query);

  assert.equal(params.get('search'), 'نیم زیپ');
  assert.equal(params.get('page'), '2');
});

test('لینک صفحه بعد دسته‌بندی و فیلترها را هم نگه می‌دارد', () => {
  const query = buildNextPageQuery({
    search: 'کت',
    sort: 'price:asc',
    categoryIds: [7],
    colorIds: [3],
    sizeIds: [1],
    limit: 24,
    page: 3,
  });
  const params = new URLSearchParams(query);

  assert.equal(params.get('search'), 'کت');
  assert.equal(params.get('sort'), 'price:asc');
  assert.equal(params.get('categoryIds'), '7');
  assert.equal(params.get('colorIds'), '3');
  assert.equal(params.get('sizeIds'), '1');
  assert.equal(params.get('limit'), '24');
  assert.equal(params.get('page'), '3');
});

test('مقایسه query به %20 و + حساس نیست (جلوگیری از replace بی‌مورد)', () => {
  // آدرس‌هایی که از لینک «مشاهده همه نتایج» می‌آیند %20 دارند، ولی
  // URLSearchParams فاصله را + می‌نویسد.
  assert.equal(
    productQueriesEqual(
      'search=%D9%86%DB%8C%D9%85%20%D8%B2%DB%8C%D9%BE',
      'search=%D9%86%DB%8C%D9%85+%D8%B2%DB%8C%D9%BE',
    ),
    true,
  );

  assert.equal(
    productQueriesEqual('search=a&sort=price:asc', 'sort=price:asc&search=a'),
    true,
  );
  assert.equal(productQueriesEqual('search=a', 'search=b'), false);
  assert.equal(productQueriesEqual('', ''), true);
});

test('لیست محصولات آدرس را از صفر نمی‌سازد (رگرسیون پریدن search)', () => {
  const list = source('components/pages/products/product-list.tsx');

  // بخش همگام‌سازی آدرس نباید URLSearchParams خالی بسازد؛ باید از
  // پارامترهای فعلی آدرس شروع کند.
  const syncStart = list.indexOf('به‌روزرسانی URL');
  const syncEnd = list.indexOf('const gridClass');
  assert.ok(
    syncStart !== -1 && syncEnd > syncStart,
    'بخش همگام‌سازی آدرس پیدا نشد',
  );

  const syncBlock = list.slice(syncStart, syncEnd);
  assert.doesNotMatch(syncBlock, /new URLSearchParams\(\)/);
  assert.match(syncBlock, /buildProductListQuery\(window\.location\.search/);

  // لینک صفحه بعد هم پارامترهای فعلی را حفظ می‌کند.
  assert.match(
    list,
    /href=\{nextPageQuery \? `\?\$\{nextPageQuery\}` : '\?'\}/,
  );
});
