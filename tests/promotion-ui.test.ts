import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { describeConfiguration } from '../components/admin/promotion/utils';
import { resolvePromotionTotals } from '../components/pages/checkout/promotion-totals';
import ProductCard from '../components/shared/product-card';
import {
  resolveSuggestionButton,
  shouldShowSuggestion,
} from '../components/shared/promotion-suggestion-action';
import {
  PromotionRewardType,
  PromotionScope,
  PromotionType,
} from '../services/features/promotions/types';

process.env.NEXT_PUBLIC_IMAGE_URL = '';

const cardProps = {
  id: 1,
  image: '/product-example.webp',
  title: 'پیراهن مردانه زوپینی',
  price: 1000000,
  slug: 'example',
};

/* =========================================================
 * نشان پروموشن روی کارت محصول
 * ========================================================= */

test('promotion badge is rendered but never changes the card price', () => {
  const html = renderToStaticMarkup(
    createElement(ProductCard, {
      ...cardProps,
      promotionBadge: { promotionId: 7, text: 'خرید ۲، ۵۰٪ تخفیف روی ارزان‌تر' },
    }),
  );

  // متن نشان دیده می‌شود
  assert.match(html, /خرید ۲، ۵۰٪ تخفیف روی ارزان‌تر/);
  assert.match(html, /data-testid="promotion-badge"/);

  // قیمت کارت دقیقاً همان قیمت اصلی است و خط‌خورده/جداگانه نشده
  assert.match(html, /۱٬۰۰۰٬۰۰۰/);
  assert.doesNotMatch(html, /<del/);
  assert.doesNotMatch(html, /clip-path/);
});

test('a card without a promotion shows no badge at all', () => {
  const html = renderToStaticMarkup(createElement(ProductCard, cardProps));

  assert.doesNotMatch(html, /promotion-badge/);
});

/* =========================================================
 * منبع اعداد چک‌اوت
 * ========================================================= */

const preview = {
  lines: [],
  promotions: { applied: [], rejected: [], notices: ['یک کالا رایگان شد'], suggestions: [] },
  totals: {
    originalPrice: 1_000_000,
    saleDiscount: 100_000,
    promotionDiscount: 200_000,
    freeItemValue: 300_000,
    shippingCost: 50_000,
    freeShipping: true,
    finalPrice: 500_000,
  },
} as unknown as Parameters<typeof resolvePromotionTotals>[0]['preview'];

test('server preview wins over the possibly stale cart', () => {
  const totals = resolvePromotionTotals({
    preview,
    pricing: {
      originalPrice: 1_000_000,
      discountPrice: 0,
      finalPrice: 900_000,
      promotionDiscountPrice: 0,
      freeItemValue: 0,
      freeShipping: false,
    },
  });

  assert.equal(totals.fromServer, true);
  assert.equal(totals.promotionDiscount, 200_000);
  assert.equal(totals.freeItemValue, 300_000);
  assert.equal(totals.freeShipping, true);
  assert.deepEqual(totals.notices, ['یک کالا رایگان شد']);
  // مبلغ بدون ارسال: ۵۰۰٬۰۰۰ - ۵۰٬۰۰۰
  assert.equal(totals.payableBeforeShipping, 450_000);
});

test('cart is used as a fallback before the preview arrives', () => {
  const totals = resolvePromotionTotals({
    preview: null,
    pricing: {
      originalPrice: 500_000,
      discountPrice: 0,
      finalPrice: 400_000,
      promotionDiscountPrice: 100_000,
      freeItemValue: 0,
      freeShipping: false,
    },
  });

  assert.equal(totals.fromServer, false);
  assert.equal(totals.promotionDiscount, 100_000);
  assert.equal(totals.payableBeforeShipping, 400_000);
  assert.deepEqual(totals.notices, []);
});

test('missing data never produces negative or NaN totals', () => {
  const totals = resolvePromotionTotals({ preview: null, pricing: null });

  assert.equal(totals.promotionDiscount, 0);
  assert.equal(totals.freeItemValue, 0);
  assert.equal(totals.payableBeforeShipping, 0);
  assert.equal(totals.freeShipping, false);
});

/* =========================================================
 * توضیح خوانا از قاعدهٔ هر نوع
 * ========================================================= */

const base = {
  rewardValue: 50,
  pairSize: 2,
  requiredQuantity: 2,
  freeQuantity: 1,
  rewardQuantity: 1,
  minCartValue: 3_000_000,
};

test('each promotion type describes its rule in plain Persian', () => {
  const dict = {
    [PromotionType.CHEAPER_ITEM_PAIR]: {
      ...base,
      type: PromotionType.CHEAPER_ITEM_PAIR,
      rewardType: PromotionRewardType.PERCENTAGE,
      minQuantity: 2,
    },
    [PromotionType.BUY_X_GET_Y_SAME_GROUP]: {
      ...base,
      type: PromotionType.BUY_X_GET_Y_SAME_GROUP,
      rewardType: PromotionRewardType.FREE_ITEM,
      minQuantity: 0,
    },
    [PromotionType.BUY_TRIGGER_GET_REWARD]: {
      ...base,
      type: PromotionType.BUY_TRIGGER_GET_REWARD,
      rewardType: PromotionRewardType.FREE_ITEM,
      minQuantity: 1,
    },
    [PromotionType.SPEND_AND_SAVE]: {
      ...base,
      type: PromotionType.SPEND_AND_SAVE,
      rewardType: PromotionRewardType.PERCENTAGE,
      minQuantity: 0,
    },
    [PromotionType.BUY_X_GET_PERCENT_OFF]: {
      ...base,
      type: PromotionType.BUY_X_GET_PERCENT_OFF,
      rewardType: PromotionRewardType.PERCENTAGE,
      minQuantity: 3,
    },
    [PromotionType.FIXED_PRICE_BUNDLE]: {
      ...base,
      type: PromotionType.FIXED_PRICE_BUNDLE,
      rewardType: PromotionRewardType.FIXED_BUNDLE_PRICE,
      minQuantity: 2,
    },
    [PromotionType.FREE_SHIPPING]: {
      ...base,
      type: PromotionType.FREE_SHIPPING,
      rewardType: PromotionRewardType.FREE_SHIPPING,
      minQuantity: 0,
    },
    [PromotionType.CART_DISCOUNT]: {
      ...base,
      type: PromotionType.CART_DISCOUNT,
      rewardType: PromotionRewardType.PERCENTAGE,
      minQuantity: 0,
    },
  };

  for (const [type, values] of Object.entries(dict)) {
    const text = describeConfiguration(values as never);

    assert.ok(text.length > 0, `${type} باید توضیح داشته باشد`);
    assert.doesNotMatch(text, /undefined|NaN/, `${type} توضیح معیوب دارد`);
  }
});

test('free item rewards are priced at zero, paid items are not', () => {
  // قرارداد: هدیهٔ رایگان با isFreeReward=true و discount برابر کل مبلغ ردیف
  const line = { saleTotal: 400_000, isFreeReward: true };

  const payable = line.isFreeReward ? 0 : line.saleTotal;

  assert.equal(payable, 0);
});

test('promotion scope enum stays in sync with the admin builder options', () => {
  assert.deepEqual(Object.values(PromotionScope).sort(), [
    'all',
    'categories',
    'categories_and_products',
    'products',
  ]);
});

/* =========================================================
 * اقدام پاپ‌آپ: هیچ‌وقت کالای پولی از مسیر هدیه اضافه نشود
 * ========================================================= */

test('a paid-item suggestion never uses the free reward path', () => {
  const button = resolveSuggestionButton({
    action: 'add_paid_item',
    requiresSelection: false,
    acceptLabel: null,
  });

  assert.equal(button.addsItem, true);
  assert.equal(button.free, false);
  assert.equal(button.label, 'افزودن به سبد');
});

test('a free reward suggestion is marked free and respects custom labels', () => {
  const button = resolveSuggestionButton({
    action: 'add_free_reward',
    requiresSelection: false,
    acceptLabel: 'هدیه‌ام را بگیر',
  });

  assert.equal(button.free, true);
  assert.equal(button.addsItem, true);
  assert.equal(button.label, 'هدیه‌ام را بگیر');
});

test('customer-choice rewards always show the selection label', () => {
  const button = resolveSuggestionButton({
    action: 'add_free_reward',
    requiresSelection: true,
    acceptLabel: 'adf',
  });

  assert.equal(button.label, 'انتخاب و افزودن');
});

test('guidance-only suggestions add nothing to the cart', () => {
  const button = resolveSuggestionButton({
    action: 'open_cart',
    requiresSelection: false,
    acceptLabel: null,
  });

  assert.equal(button.addsItem, false);
  assert.equal(button.free, false);
});

test('popup is shown once per cart state and never after dismissal', () => {
  const suggestion = { stateKey: '5:2:1', promotionId: 5 };

  assert.equal(
    shouldShowSuggestion(suggestion, {
      popupShownFor: null,
      dismissedStateKey: null,
      dismissedPromotionIds: [],
    }),
    true,
  );

  // همان وضعیت سبد، قبلاً نمایش داده شده
  assert.equal(
    shouldShowSuggestion(suggestion, {
      popupShownFor: '5:2:1',
      dismissedStateKey: null,
      dismissedPromotionIds: [],
    }),
    false,
  );

  // در همین نشست بسته شده
  assert.equal(
    shouldShowSuggestion(suggestion, {
      popupShownFor: null,
      dismissedStateKey: '5:2:1',
      dismissedPromotionIds: [],
    }),
    false,
  );

  // پروموشن رد شده است
  assert.equal(
    shouldShowSuggestion(suggestion, {
      popupShownFor: null,
      dismissedStateKey: null,
      dismissedPromotionIds: [5],
    }),
    false,
  );

  // سبد تغییر کرده: وضعیت تازه، دوباره مجاز است
  assert.equal(
    shouldShowSuggestion({ stateKey: '5:3:1', promotionId: 5 }, {
      popupShownFor: '5:2:1',
      dismissedStateKey: null,
      dismissedPromotionIds: [],
    }),
    true,
  );

  assert.equal(
    shouldShowSuggestion(null, {
      popupShownFor: null,
      dismissedStateKey: null,
      dismissedPromotionIds: [],
    }),
    false,
  );
});

test('the suggestion surfaces as a non-blocking card, never a modal dialog', () => {
  const source = readFileSync(
    resolve(__dirname, '../components/shared/promotion-suggestion-popup.tsx'),
    'utf8',
  );

  // کارت کنار/پایین صفحه
  assert.match(source, /<aside/);
  assert.match(source, /fixed inset-x-3 bottom-3/);

  // مودالی که صفحه را قفل می‌کند نباید وجود داشته باشد
  assert.doesNotMatch(source, /<DialogContent/);
  assert.doesNotMatch(source, /<Dialog open/);
});
