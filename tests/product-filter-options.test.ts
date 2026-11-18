import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const src = readFileSync(
  resolve(__dirname, '../components/pages/products/product-filter.tsx'),
  'utf8',
);
const listSrc = readFileSync(
  resolve(__dirname, '../components/pages/products/product-list.tsx'),
  'utf8',
);
const allProductsPage = readFileSync(
  resolve(__dirname, '../app/(public)/products/page.tsx'),
  'utf8',
);
const categoryPage = readFileSync(
  resolve(__dirname, '../app/(public)/product-category/[categorySlug]/page.tsx'),
  'utf8',
);

test('رنگ‌ها هم سواچ و هم نام خوانا دارند و انتخاب‌شده با بیش از رنگ مشخص می‌شود', () => {
  assert.match(src, /style=\{\{ backgroundColor: color\.hexCode \}\}/);
  assert.match(src, /color\.name/);
  assert.match(src, /checked/);
  assert.match(src, /border-primary bg-primary\/10/);
  assert.doesNotMatch(src, /truncate\}>\{color\.name\}/);
});

test('اسلایدر قیمت با بازهٔ واقعی مقید می‌شود و دو سر با هم همگام‌اند', () => {
  assert.match(src, /type="range"/);
  assert.match(src, /min=\{boundMin\}/);
  assert.match(src, /max=\{boundMax\}/);
  assert.match(src, /handlePriceMinChange/);
  assert.match(src, /handlePriceMaxChange/);
  assert.match(src, /Math\.min\(Math\.floor\(value\), tempMaxPrice\)/);
  assert.match(src, /Math\.max\(Math\.floor\(value\), tempMinPrice\)/);
  assert.match(src, /toLocaleString\('fa-IR'\)/);
});

test('سایزها با ترتیب داده‌ی واقعی و پاک کردن فیلترها در انتهای لیست است', () => {
  assert.match(src, /sortSizeOptions\(sizes\)/);
  assert.match(src, /پاک کردن فیلترها/);
  assert.match(src, /handleClearAndClose/);
  // پاک کردن قیمت را هم صفر/بازنشانی می‌کند
  assert.match(src, /setTempMinPrice\(boundMin\)/);
  assert.match(src, /setTempMaxPrice\(boundMax\)/);
});

test('داده‌ی فیلتر از سرور و از دامنهٔ درست می‌آید', () => {
  assert.match(allProductsPage, /getCategoryFilters\(\)/);
  assert.match(categoryPage, /getCategoryFilters\(category\.data\.id\)/);
  assert.match(listSrc, /filterMinPrice/);
  assert.match(listSrc, /filterMaxPrice/);
});
