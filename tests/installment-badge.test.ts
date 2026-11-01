import assert from 'node:assert/strict';
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

const BADGE = 'خرید اقساطی ۴ مرحله‌ای اسنپ‌پی';

test('every product card carries the SnappPay installment badge at its bottom', () => {
  const html = renderToStaticMarkup(createElement(ProductCard, props));

  assert.match(html, new RegExp(BADGE));
  assert.equal(html.split(BADGE).length - 1, 1, 'the badge appears exactly once');

  // It sits after the price block, i.e. as the last element of the card text.
  const priceEnd = html.lastIndexOf('تومان</span>');
  assert.ok(priceEnd > -1);
  assert.ok(
    html.indexOf(BADGE) > priceEnd,
    'the badge is rendered below the price',
  );

  // Informational only: no invented installment amount.
  assert.doesNotMatch(html, /قسط[^<]*تومان/);
});

test('the badge is present for discounted products too and stays in the slider variant', () => {
  const discounted = renderToStaticMarkup(
    createElement(ProductCard, {
      ...props,
      discount: {
        id: 1,
        code: null,
        discountAmount: 200000,
        finalPrice: 800000,
        originalPrice: 1000000,
        maxDiscountAmount: null,
        type: DiscountType.PERCENTAGE,
        value: 20,
      },
    }),
  );
  assert.match(discounted, new RegExp(BADGE));

  const slider = renderToStaticMarkup(
    createElement(ProductCard, { ...props, slider: true }),
  );
  assert.match(slider, new RegExp(BADGE));
});

test('a product without a price does not advertise installments', () => {
  const html = renderToStaticMarkup(
    createElement(ProductCard, { ...props, price: 0 }),
  );
  assert.doesNotMatch(html, new RegExp(BADGE));
});
