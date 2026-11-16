import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const listSrc = readFileSync(
  resolve(__dirname, '../components/pages/products/product-list.tsx'),
  'utf-8',
);
const filterSrc = readFileSync(
  resolve(__dirname, '../components/pages/products/product-filter.tsx'),
  'utf-8',
);

test('فیلتر در دسکتاپ یک سایدبار دائمی است، نه مودال/اورلی', () => {
  // Neither `fixed` overlay nor body lock is used
  assert.doesNotMatch(filterSrc, /fixed/);
  assert.doesNotMatch(filterSrc, /bg-black\/40/);
  // یک genuinely part-of-layout container وجود دارد (border, p-4, sticky)
  assert.match(filterSrc, /sticky top-\[|border-l|p-4/);
});

test('صفحه‌ی موبایل به‌جای مودال، فیلتر را به‌صورت inline بالای گرید دارد', () => {
  // همان بلوک inline در داخل صفحه (نه overlay بالای آن)
  assert.match(listSrc, /<div className="lg:hidden">/);
  const productFilterTags = listSrc.match(/<ProductFilter[\s\S]*?\/>/g) || [];
  assert.ok(productFilterTags.some(tag => tag.includes('inline')), 'no inline ProductFilter tag found');
  assert.doesNotMatch(filterSrc, /max-w-\[500px\]/);
});

test('سایدبار فیلتر فقط در دسکتاپ نمایش داده می‌شود (lg:block)', () => {
  assert.match(filterSrc, /hidden/);
  assert.match(filterSrc, /lg:block/);
});

test('درگاه فیلتر دسته‌بندی از سرور پر می‌شود — نه از لیست سراسری', () => {
  const categoryPagePath = resolve(
    __dirname,
    '../app/(public)/product-category/[categorySlug]/page.tsx',
  );
  const categorySrc = readFileSync(categoryPagePath, 'utf-8');
  assert.match(categorySrc, /getCategoryFilters\(category\.data\.id\)/);

  // product-list دیگر لیست‌های سراسری را fetch نمی‌کند
  assert.doesNotMatch(listSrc, /useColorsList\(\)/);
  assert.doesNotMatch(listSrc, /useSizeList\(\)/);
});

test('شماره‌ی محصولات دیگر در عنوان دسته نمایش داده نمی‌شود', () => {
  const categoryPagePath = resolve(
    __dirname,
    '../app/(public)/product-category/[categorySlug]/page.tsx',
  );
  const categorySrc = readFileSync(categoryPagePath, 'utf-8');
  // هیچ شمارش‌گری در h1 وجود ندارد
  assert.doesNotMatch(categorySrc, /\(\d+\s*محصuول\s*\)/);
});
