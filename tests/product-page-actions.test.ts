import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const source = (path: string) =>
  readFileSync(resolve(__dirname, '..', path), 'utf8');

const actionSrc = source('components/shared/product-action-button.ts');
const contentSrc = source('components/pages/product/content.tsx');
const shareSrc = source('components/pages/product/share-button.tsx');
const wishlistSrc = source('components/pages/product/wishlist-button.tsx');
const compareSrc = source('components/shared/compare-toggle.tsx');
const breadcrumbSrc = source('components/shared/breadcrumb.tsx');

test('هر سه اکشن صفحه محصول از یک قاعدهٔ اندازهٔ مشترک استفاده می‌کنند', () => {
  assert.match(actionSrc, /h-\[50px\]/);
  assert.match(actionSrc, /w-\[50px\]/);
  assert.match(actionSrc, /items-center/);
  assert.match(actionSrc, /justify-center/);
  assert.match(actionSrc, /rounded-xl/);
  assert.match(actionSrc, /border/);

  for (const [name, src] of [
    ['share', shareSrc],
    ['wishlist', wishlistSrc],
  ] as const) {
    assert.match(src, /productActionButtonClass/, `${name} uses shared rule`);
    assert.doesNotMatch(
      src,
      /h-\[(?:48|50)px\][^\n]*aspect-square/,
      `${name} must not set its own box size`,
    );
  }

  assert.match(compareSrc, /actionClassName/);
  assert.match(contentSrc, /actionClassName=\{productActionButtonClass\}/);
});

test('افزودن به سبد خرید نارنجی برند است و کنترل‌های قرمز دیگر دست‌نخورده‌اند', () => {
  assert.match(contentSrc, /bg-\[rgb\(201,97,21\)\]/);
  assert.doesNotMatch(
    contentSrc,
    /hover:bg-\[#d8354b\]|active:bg-\[#c22e42\]/,
  );
  // برچسب درصد تخفیف همان قرمز قبلی است و رنگ پاک‌کننده‌ها عوض نشده
  assert.match(contentSrc, /bg-\[#EF4056\] px-2/);
  assert.match(source('components/layout/public/cart.tsx'), /text-red-500/);
});

test('مسیر راهنما از زیر هدر کامل بیرون می‌آید و در صفحهٔ محصول تکرار نمی‌شود', () => {
  // breadcrumb خودش فاصلهٔ ۵۲px هدر را می‌گیرد
  assert.match(breadcrumbSrc, /pt-\[calc\(3\.25rem\+0\.5rem\)\]/);
  // و محتوای محصول دیگر یک pt دیگر ۵۲px اضافه نمی‌کند
  assert.doesNotMatch(contentSrc, /pt-\[52px\]/);
  assert.match(breadcrumbSrc, /flex-wrap/);
  assert.match(breadcrumbSrc, /break-words/);
  assert.match(breadcrumbSrc, /relative z-0/);
});
