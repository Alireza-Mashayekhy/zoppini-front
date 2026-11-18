import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import {
  DEFAULT_PRODUCT_SORT,
  PRODUCT_SORT_BEST_SELLING,
  PRODUCT_SORT_CHEAPEST,
  PRODUCT_SORT_MOST_EXPENSIVE,
  PRODUCT_SORT_NEWEST,
  PRODUCT_SORT_OPTIONS,
} from '../lib/product-sort';

const source = (path: string) =>
  readFileSync(resolve(__dirname, '..', path), 'utf8');

test('«جدیدترین» بر اساس تاریخ ساخت نزولی است', () => {
  assert.equal(PRODUCT_SORT_NEWEST, 'createdAt:desc');
  assert.equal(DEFAULT_PRODUCT_SORT, PRODUCT_SORT_NEWEST);

  const newest = PRODUCT_SORT_OPTIONS.find(
    option => option.label === 'جدیدترین',
  );
  assert.equal(newest?.value, PRODUCT_SORT_NEWEST);
});

test('کمترین/بیشترین قیمت به فیلد price وصل‌اند', () => {
  assert.equal(PRODUCT_SORT_CHEAPEST, 'price:asc');
  assert.equal(PRODUCT_SORT_MOST_EXPENSIVE, 'price:desc');
});

test('«پرفروش‌ترین» یک مرتب‌سازی واقعی و جدا از بقیه است', () => {
  assert.equal(PRODUCT_SORT_BEST_SELLING, 'sold:desc');

  const bestSelling = PRODUCT_SORT_OPTIONS.find(
    option => option.label === 'پرفروش‌ترین',
  );
  assert.equal(bestSelling?.value, PRODUCT_SORT_BEST_SELLING);

  // هیچ گزینه‌ای برچسب/مقدار تکراری نداشته باشد؛ پرفروش‌ترین نباید
  // لیبل دیگری روی createdAt یا price باشد.
  const values = PRODUCT_SORT_OPTIONS.map(option => option.value);
  assert.equal(new Set(values).size, values.length);
});

test('دقیقاً چهار گزینه و به ترتیب خواسته‌شده وجود دارد', () => {
  const labels: string[] = PRODUCT_SORT_OPTIONS.map(option => option.label);

  assert.deepEqual(labels, [
    'کمترین قیمت',
    'بیشترین قیمت',
    'پرفروش‌ترین',
    'جدیدترین',
  ]);

  for (const removed of ['قدیمی‌ترین', 'ارزان‌ترین', 'گران‌ترین']) {
    assert.ok(!labels.includes(removed), `گزینهٔ حذف‌شده مانده است: ${removed}`);
  }

  const prices = PRODUCT_SORT_OPTIONS.filter(option =>
    option.value.startsWith('price:'),
  );
  assert.deepEqual(
    prices.map(option => option.value.split(':')[1]),
    ['asc', 'desc'],
  );
});

test('لیست محصولات منوی مرتب‌سازی را از همین ثابت‌ها می‌سازد', () => {
  const list = source('components/pages/products/product-list.tsx');

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

test('بک‌اند پرفروش‌ترین را از دادهٔ واقعی سفارش‌ها محاسبه می‌کند', () => {
  const sortUtil = source('../back/src/products/utils/product-sort.util.ts');

  assert.match(sortUtil, /SORTABLE_FIELDS = \[[^\]]*'sold'/);
  assert.match(sortUtil, /FROM order_item/);
  assert.match(sortUtil, /status IN \('paid', 'shipped', 'delivered'\)/);
  assert.match(sortUtil, /orderBy\('soldCount'/);
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
