import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import ProductCard from '../components/shared/product-card';
import { DiscountType } from '../services/features/discounts/types';

process.env.NEXT_PUBLIC_IMAGE_URL = '';
const props = {
  id: 1,
  image: '/product-example.webp',
  title: 'پیراهن مردانه زوپینی',
  price: 1000000,
  slug: 'example',
};
const discount = {
  id: 1,
  code: null,
  discountAmount: 200000,
  finalPrice: 800000,
  originalPrice: 1000000,
  maxDiscountAmount: null,
  type: DiscountType.PERCENTAGE,
  value: 20,
};

test('product card has full-bleed image and top-attached ribbon without moving existing actions', () => {
  const html = renderToStaticMarkup(
    createElement(ProductCard, { ...props, discount }),
  );
  assert.match(html, /aspect-\[4\/5\]/);
  assert.match(html, /object-cover/);
  assert.match(html, /left-3 top-0/);
  assert.match(html, /clip-path:polygon/);
  assert.match(html, /۲۰٪/);
  assert.match(html, /<del/);
  assert.match(html, /۸۰۰٬۰۰۰/);
  // مقایسه بالا-چپ، زیر برچسب تخفیف؛ سبد خرید بالا-راست
  assert.match(html, /left-1\.5 z-20 sm:left-3 top-\[4\.25rem\]/);
  assert.match(
    html,
    /right-1\.5 top-1\.5 z-20 flex gap-1\.5 sm:right-3 sm:top-3/,
  );
  assert.match(html, /افزودن به سبد خرید/);
  assert.match(html, /افزودن به مقایسه/);
  assert.match(html, /href="\/product\/example"/);
  assert.doesNotMatch(html, /pb-12|aspect-9\/16|rounded-full/);
});

test('regular card never invents a discount or secondary product description', () => {
  const html = renderToStaticMarkup(createElement(ProductCard, props));
  assert.doesNotMatch(html, /<del|clip-path|Regular Fit/);
  assert.match(html, /۱٬۰۰۰٬۰۰۰/);
});

test('slider retains flexible image height and optional subtitle is escaped', () => {
  const html = renderToStaticMarkup(
    createElement(ProductCard, {
      ...props,
      slider: true,
      discount,
      showActions: false,
      subtitle: 'Regular Fit <test>',
    }),
  );
  assert.match(html, /min-h-0 flex-1/);
  assert.match(html, /left-3 top-0/);
  assert.match(html, /Regular Fit &lt;test&gt;/);
  assert.doesNotMatch(html, /افزودن به سبد خرید|افزودن به مقایسه/);
});

test('regular card puts compare top-left and cart top-right, closer to corners on mobile', () => {
  const html = renderToStaticMarkup(createElement(ProductCard, props));
  assert.match(html, /absolute left-1\.5 z-20 sm:left-3 top-1\.5 sm:top-3/);
  assert.match(
    html,
    /absolute right-1\.5 top-1\.5 z-20 flex gap-1\.5 sm:right-3 sm:top-3/,
  );
  assert.doesNotMatch(html, /top-\[4\.25rem\]/);
});

test('sticky products toolbar stays above card action buttons', () => {
  const list = readFileSync(
    resolve(__dirname, '../components/pages/products/product-list.tsx'),
    'utf8',
  );
  const card = readFileSync(
    resolve(__dirname, '../components/shared/product-card.tsx'),
    'utf8',
  );
  const toolbarZ = Number(list.match(/sticky z-(\d+)/)?.[1]);
  const actionZ = Math.max(
    ...Array.from(card.matchAll(/absolute [^']*z-(\d+)/g), m => Number(m[1])),
  );
  assert.ok(
    toolbarZ > actionZ,
    `toolbar z-${toolbarZ} must exceed z-${actionZ}`,
  );
});
