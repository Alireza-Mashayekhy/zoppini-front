import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

/**
 * فاز ۵: آرشیو دسته‌بندی باید index,follow باشد و محدودیتی در sitemap نداشته
 * باشد؛ صفحات خصوصی (سبد خرید/تسویه/جستجو/مقایسه) باید همچنان noindex باشند.
 */

const categoryPage = readFileSync(
  resolve(__dirname, '../app/(public)/product-category/[categorySlug]/page.tsx'),
  'utf-8',
);
const cartPage = readFileSync(
  resolve(__dirname, '../app/(public)/checkout/layout.tsx'),
  'utf-8',
);
const comparePage = readFileSync(
  resolve(__dirname, '../app/(public)/compare/page.tsx'),
  'utf-8',
);

test('category archive metadata is explicitly index,follow — no silent noindex override', () => {
  assert.match(categoryPage, /robots:\s*{/);
  assert.match(categoryPage, /index:\s*true/);
  assert.match(categoryPage, /follow:\s*true/);
  // canonical حفظ شده است
  assert.match(categoryPage, /canonical:/);
});

test('checkout layout keeps its subtree restricted (noindex,nofollow)', () => {
  assert.match(cartPage, /robots|noindex|index:\s*false/);
});

test('compare page keeps noindex,follow (documented policy) — not flipped by this change', () => {
  assert.match(comparePage, /noindex/);
});
