import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import {
  DEFAULT_PRODUCT_SORT,
  PRODUCT_SORT_CHEAPEST,
  PRODUCT_SORT_MOST_EXPENSIVE,
  PRODUCT_SORT_NEWEST,
  PRODUCT_SORT_OLDEST,
  PRODUCT_SORT_OPTIONS,
} from '../lib/product-sort';

const source = (path: string) =>
  readFileSync(resolve(__dirname, '..', path), 'utf8');

test('«جدیدترین» به ترتیب نزولی تاریخ فرستاده می‌شود', () => {
  // بک‌اند جهت را عیناً اعمال می‌کند؛ asc یعنی قدیمی‌ترین‌ها اول.
  assert.equal(PRODUCT_SORT_NEWEST, 'createdAt:desc');
  assert.equal(PRODUCT_SORT_OLDEST, 'createdAt:asc');

  const newest = PRODUCT_SORT_OPTIONS.find(
    option => option.label === 'جدیدترین',
  );
  assert.equal(newest?.value, PRODUCT_SORT_NEWEST);

  const oldest = PRODUCT_SORT_OPTIONS.find(
    option => option.label === 'قدیمی‌ترین',
  );
  assert.equal(oldest?.value, PRODUCT_SORT_OLDEST);

  assert.equal(DEFAULT_PRODUCT_SORT, PRODUCT_SORT_NEWEST);
});

test('ارزان‌ترین صعودی و گران‌ترین نزولی است', () => {
  assert.equal(PRODUCT_SORT_CHEAPEST, 'price:asc');
  assert.equal(PRODUCT_SORT_MOST_EXPENSIVE, 'price:desc');
});

test('هیچ گزینه‌ای برچسب و مقدار ناسازگار ندارد', () => {
  const labels = PRODUCT_SORT_OPTIONS.map(option => option.label);
  assert.deepEqual(labels, [
    'جدیدترین',
    'قدیمی‌ترین',
    'ارزان‌ترین',
    'گران‌ترین',
  ]);

  for (const option of PRODUCT_SORT_OPTIONS) {
    const [, direction] = option.value.split(':');
    if (option.label === 'جدیدترین' || option.label === 'گران‌ترین') {
      assert.equal(direction, 'desc', `${option.label} باید نزولی باشد`);
    } else {
      assert.equal(direction, 'asc', `${option.label} باید صعودی باشد`);
    }
  }
});

test('لیست محصولات منوی مرتب‌سازی را از همین ثابت‌ها می‌سازد', () => {
  const list = source('components/pages/products/product-list.tsx');

  // دیگر هیچ نگاشت دستی/ناسازگاری در کامپوننت نمانده باشد.
  assert.doesNotMatch(
    list,
    /value="createdAt:asc"[\s\S]{0,60}جدیدترین/,
    'گزینه «جدیدترین» نباید به createdAt:asc وصل باشد',
  );
  assert.match(list, /PRODUCT_SORT_OPTIONS\.map/);
  assert.match(list, /initialParams\.sort \|\| DEFAULT_PRODUCT_SORT/);
  assert.match(
    list,
    /queryParams\.append\('sort', params\.sort \|\| DEFAULT_PRODUCT_SORT\)/,
  );
});

test('صفحه‌های عمومی از همان مرتب‌سازی پیش‌فرض برای داده‌ی سرور استفاده می‌کنند', () => {
  const categoryPage = source(
    'app/(public)/product-category/[categorySlug]/page.tsx',
  );
  assert.match(
    categoryPage,
    /productCategoryParams\(search, category\.data\.id\)/,
  );
  assert.match(
    source('lib/product-category-params.ts'),
    /DEFAULT_PRODUCT_SORT/,
  );

  for (const path of [
    'app/(public)/products/page.tsx',
    'app/(public)/discounted-products/page.tsx',
  ]) {
    const page = source(path);
    assert.match(page, /DEFAULT_PRODUCT_SORT/, path);
    assert.match(
      page,
      /sort: (?:search|params)\.sort \|\| DEFAULT_PRODUCT_SORT/,
      path,
    );
  }
});
