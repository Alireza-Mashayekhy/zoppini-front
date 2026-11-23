import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import React from 'react';
import { renderToString } from 'react-dom/server';

import ProductPromotionBanner from '../components/pages/product/promotion-banner';
import { selectCartPromotionBanner } from '../lib/promotion-banner';

Object.assign(globalThis, { React });

test('banner renders the approved black-friday composition', () => {
  const html = renderToString(
    <ProductPromotionBanner name="بلک فرایدی ۱۴۰۴" percent={20} />,
  );

  // badge: exact text, black background, white bold uppercase
  assert.match(html, /BLACK FRIDAY/);
  assert.match(html, /bg-black/);
  assert.match(html, /uppercase/);

  // sale-red background from the approved palette
  assert.match(html, /bg-\[#A9142D\]/);

  // dynamic percentage + persian supporting copy
  assert.match(html, /۲۰٪/);
  assert.match(html, /تخفیف بیشتر/);
  assert.match(html, /تخفیف ویژه سبد خرید شما/);

  // RTL + no overflow on mobile
  assert.match(html, /dir="rtl"/);
  assert.match(html, /flex-col/);
  assert.match(html, /min-w-0/);
  assert.match(html, /whitespace-nowrap/);
});

test('banner keeps the real backend percentage (not hardcoded)', () => {
  const ten = renderToString(
    <ProductPromotionBanner name="کمپین" percent={10} />,
  );
  const thirtyFive = renderToString(
    <ProductPromotionBanner name="کمپین" percent={35} />,
  );

  assert.match(ten, /۱۰٪/);
  assert.doesNotMatch(ten, /۲۰٪/);
  assert.match(thirtyFive, /۳۵٪/);
});

test('banner uses the promotion name only for the accessible label', () => {
  const html = renderToString(
    <ProductPromotionBanner name="کمپین بلک فرایدی" percent={20} />,
  );

  assert.match(html, /aria-label="کمپین بلک فرایدی: ۲۰٪ تخفیف بیشتر"/);
  // the name must not add a second visible english micro-label
  assert.doesNotMatch(html, /SPECIAL OFFER/i);
  assert.equal((html.match(/BLACK FRIDAY/g) ?? []).length, 1);
});

test('banner renders nothing without a valid percentage', () => {
  for (const percent of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(
      renderToString(<ProductPromotionBanner name="کمپین" percent={percent} />),
      '',
    );
  }
});

// ---------------------------------------------------------------------------
// gating: only genuinely qualifying promotions get the banner
// ---------------------------------------------------------------------------

test('banner selection accepts only a cart-discount percentage badge', () => {
  const banner = selectCartPromotionBanner([
    {
      promotionId: 7,
      name: 'بلک فرایدی ۱۴۰۴',
      badgeText: 'تخفیف ویژه سبد خرید',
      type: 'cart_discount',
      rewardType: 'percentage',
      rewardValue: 20,
    },
  ]);

  assert.deepEqual(banner, {
    promotionId: 7,
    name: 'بلک فرایدی ۱۴۰۴',
    percent: 20,
  });
});

test('banner selection rejects promotions the backend did not qualify', () => {
  const base = {
    promotionId: 1,
    badgeText: 'نشان',
    name: 'کمپین',
  };

  assert.equal(selectCartPromotionBanner(undefined), null);
  assert.equal(selectCartPromotionBanner([]), null);

  // wrong promotion type (not a cart discount)
  assert.equal(
    selectCartPromotionBanner([
      { ...base, type: 'spend_and_save', rewardType: 'percentage', rewardValue: 20 },
    ]),
    null,
  );

  // non-percentage reward (fixed amount / free shipping / ...)
  assert.equal(
    selectCartPromotionBanner([
      { ...base, type: 'cart_discount', rewardType: 'fixed', rewardValue: 500000 },
    ]),
    null,
  );

  // missing or invalid percentage → no banner (never a hardcoded fallback)
  for (const rewardValue of [null, undefined, 0, -10, Number.NaN, 'abc']) {
    assert.equal(
      selectCartPromotionBanner([
        { ...base, type: 'cart_discount', rewardType: 'percentage', rewardValue },
      ]),
      null,
    );
  }
});

test('banner selection falls back to the badge text when no name is given', () => {
  const banner = selectCartPromotionBanner([
    {
      promotionId: 9,
      badgeText: 'تخفیف بلک فرایدی',
      type: 'cart_discount',
      rewardType: 'percentage',
      rewardValue: '15',
    },
  ]);

  assert.deepEqual(banner, {
    promotionId: 9,
    name: 'تخفیف بلک فرایدی',
    percent: 15,
  });
});

test('product page mounts the banner only from eligible badges', () => {
  const source = readFileSync(
    new URL('../components/pages/product/content.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /selectCartPromotionBanner\(product\.promotionBadges\)/);
  assert.match(source, /cartPromotionBanner && \(\s*<ProductPromotionBanner/);
  // the bannered promotion is not repeated in the legacy badge list
  assert.match(source, /badge\.promotionId !== cartPromotionBanner\?\.promotionId/);
  // the removed label must not come back anywhere on the page
  assert.doesNotMatch(source, /SPECIAL OFFER/i);
});
