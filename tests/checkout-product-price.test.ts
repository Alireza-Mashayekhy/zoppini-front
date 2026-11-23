import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { resolveCheckoutLinePrice } from '../components/pages/checkout/line-price';
import OrderSummary from '../components/pages/checkout/order-summary';
import type { CartItem } from '../services/features/cart/types';
import type { CheckoutPreviewResponse } from '../services/features/orders/type';

process.env.NEXT_PUBLIC_IMAGE_URL = '';

/* --------------------------------------------------------------------------
 * نمونهٔ واقعی گزارش‌شده:
 *   قیمت فهرست ۹,۹۸۰,۰۰۰ · تخفیف سطح محصول ۵۰٪ → ۴,۹۹۰,۰۰۰
 *   پروموشن سبد ۲۰٪ (ترتیبی) → ۹۹۸,۰۰۰ · پرداختی نهایی ۳,۹۹۲,۰۰۰
 * ردیف محصول باید ۴,۹۹۰,۰۰۰ را نشان دهد، نه ۳,۹۹۲,۰۰۰ و نه ۸,۹۸۲,۰۰۰.
 * ------------------------------------------------------------------------ */

const LIST_UNIT = 9_980_000;
const SALE_UNIT = 4_990_000;
const CART_PROMO = 998_000;
const PAYABLE_UNIT = SALE_UNIT - CART_PROMO;

function cartItem(overrides: Partial<CartItem> = {}, variantOverrides = {}) {
  return {
    id: 55,
    quantity: 1,
    payablePrice: PAYABLE_UNIT,
    payableTotal: PAYABLE_UNIT,
    saleTotal: SALE_UNIT,
    promotion: {
      promotionDiscount: CART_PROMO,
      promotionDiscountPerUnit: CART_PROMO,
      isFreeReward: false,
      rewardPromotionId: null,
      labels: ['۲۰٪ تخفیف سبد خرید'],
      promotionIds: [3],
    },
    variant: {
      id: 101,
      price: LIST_UNIT,
      originalPrice: LIST_UNIT,
      // سرور این فیلد را با قیمت پس از پروموشن سبد بازنویسی می‌کند
      discountedPrice: PAYABLE_UNIT,
      salePrice: SALE_UNIT,
      discount: { value: 50 },
      stock: 5,
      color: { name: 'قهوه‌ای' },
      size: { name: 'M' },
      product: {
        title: 'پیراهن پلید چهاررنگ کلاسیک زوپینی',
        image: '/p.webp',
        slug: 'p',
      },
      ...variantOverrides,
    },
    ...overrides,
  } as unknown as CartItem;
}

const preview = (lineId: number, originalPrice: number, salePrice: number) =>
  ({
    lines: [
      {
        lineId,
        variantId: 101,
        productId: 1,
        title: 'پیراهن پلید چهاررنگ کلاسیک زوپینی',
        slug: 'p',
        image: '/p.webp',
        colorName: 'قهوه‌ای',
        sizeName: 'M',
        quantity: 1,
        originalPrice,
        salePrice,
        saleDiscount: 0,
        promotionDiscount: CART_PROMO,
        isFreeReward: false,
        promotionRewardId: null,
        promotionLabel: '۲۰٪ تخفیف سبد خرید',
        promotionIds: [3],
      },
    ],
    promotions: { applied: [], rejected: [], notices: [], suggestions: [] },
    totals: {
      originalPrice: LIST_UNIT,
      saleDiscount: LIST_UNIT - SALE_UNIT,
      promotionDiscount: CART_PROMO,
      freeItemValue: 0,
      shippingCost: 0,
      freeShipping: true,
      finalPrice: PAYABLE_UNIT,
    },
  }) as unknown as CheckoutPreviewResponse['data'];

const render = (
  items: CartItem[],
  checkoutPreview: CheckoutPreviewResponse['data'] | null = null,
) =>
  renderToStaticMarkup(
    createElement(OrderSummary, {
      items,
      checkoutPreview,
      appliedDiscount: null,
      shippingCost: 0,
      isFreeShipping: true,
      hasSelectedAddress: false,
      isPickup: true,
      pricing: {
        originalPrice: LIST_UNIT,
        discountPrice: LIST_UNIT - SALE_UNIT,
        promotionDiscountPrice: CART_PROMO,
        freeItemValue: 0,
        finalPrice: PAYABLE_UNIT,
        freeShipping: true,
      },
      onQuantityChange: () => {},
      onRemoveItem: () => {},
    }),
  );

/* ------------------------------- Test A ---------------------------------- */

test('A: ردیف محصول قیمت سطح محصول را نشان می‌دهد نه مبلغ پس از پروموشن سبد', () => {
  const html = render([cartItem()]);

  assert.match(html, /4,990,000/, 'قیمت سطح محصول باید دیده شود');
  assert.match(html, /<del[^>]*>9,980,000/, 'قیمت فهرست باید خط‌خورده باشد');
  assert.match(html, /۵۰/, 'درصد تخفیف سطح محصول باید نشان داده شود');
  assert.doesNotMatch(html, /8,982,000/, 'قیمت غلط گزارش‌شده نباید وجود داشته باشد');
  // ردیف، مبلغ پس از پروموشن سبد را هم نشان نمی‌دهد
  assert.doesNotMatch(html, /3,992,000 تومان<\/span>\s*<del/);
});

test('A: مبلغ نهایی و تخفیف سبد جداگانه در جمع‌های خلاصه می‌آیند', () => {
  const html = render([cartItem()]);

  assert.match(html, /تخفیف پیشنهادهای ویژه/);
  assert.match(html, /- 998,000 تومان/);
  assert.match(html, /قابل پرداخت/);
  assert.match(html, /3,992,000 تومان/);
});

test('A: پیش‌نمایش سرور منبع اولویت‌دار است', () => {
  const html = render([cartItem()], preview(55, LIST_UNIT, SALE_UNIT));

  assert.match(html, /4,990,000/);
  assert.match(html, /<del[^>]*>9,980,000/);
  assert.doesNotMatch(html, /8,982,000/);
});

test('A: بدون فیلدهای جدید سرور هم همان عدد درست بازسازی می‌شود', () => {
  const legacy = cartItem({ saleTotal: undefined });
  (legacy.variant as { salePrice?: number }).salePrice = undefined;
  (legacy.variant as { discountedPrice?: number }).discountedPrice = PAYABLE_UNIT;

  const html = render([legacy]);

  assert.match(html, /4,990,000/);
  assert.doesNotMatch(html, /8,982,000/);
});

/* ------------------------------- Test B ---------------------------------- */

test('B: هر درصد تخفیف دیگری هم درست نمایش داده می‌شود', () => {
  const list = 2_000_000;
  const sale = 1_400_000; // ۳۰٪

  const html = render([
    cartItem(
      {
        saleTotal: sale,
        payableTotal: sale,
        payablePrice: sale,
        promotion: {
          promotionDiscount: 0,
          promotionDiscountPerUnit: 0,
          isFreeReward: false,
          rewardPromotionId: null,
          labels: [],
          promotionIds: [],
        },
      },
      { price: list, originalPrice: list, discountedPrice: sale, salePrice: sale, discount: { value: 30 } },
    ),
  ]);

  assert.match(html, /1,400,000/);
  assert.match(html, /<del[^>]*>2,000,000/);
  assert.match(html, /۳۰/);
});

/* ------------------------------- Test C ---------------------------------- */

test('C: محصول بدون تخفیف، قیمت اصلی را بدون تخفیف مصنوعی نشان می‌دهد', () => {
  const html = render([
    cartItem(
      {
        saleTotal: LIST_UNIT,
        payableTotal: LIST_UNIT,
        payablePrice: LIST_UNIT,
        promotion: {
          promotionDiscount: 0,
          promotionDiscountPerUnit: 0,
          isFreeReward: false,
          rewardPromotionId: null,
          labels: [],
          promotionIds: [],
        },
      },
      { discountedPrice: LIST_UNIT, salePrice: LIST_UNIT, discount: null },
    ),
  ]);

  assert.match(html, /9,980,000 تومان/);
  assert.doesNotMatch(html, /<del[^>]*>9,980,000/);
  assert.doesNotMatch(html, /٪ تخفیف/);
});

/* ------------------------------- Test D ---------------------------------- */

test('D: تخفیف پروموشن سبد در قیمت ردیف اعمال نمی‌شود و جدا می‌ماند', () => {
  const html = render([cartItem()]);

  // ردیف: قیمت سطح محصول
  assert.match(html, /4,990,000 تومان/);
  // جمع‌ها: تخفیف سبد جداگانه
  assert.match(html, /تخفیف پیشنهادهای ویژه/);
  assert.match(html, /998,000/);
  // برچسب خود پروموشن هم زیر ردیف دیده می‌شود
  assert.match(html, /۲۰٪ تخفیف سبد خرید/);
});

/* ------------------------------- Test E ---------------------------------- */

test('E: ردیف، سبد و چک‌اوت روی یک قیمت سطح محصول توافق دارند', () => {
  const fromCart = resolveCheckoutLinePrice({
    quantity: 1,
    listUnitPrice: LIST_UNIT,
    saleTotal: SALE_UNIT,
    payableTotal: PAYABLE_UNIT,
    cartPromotionDiscount: CART_PROMO,
  });

  const fromPreview = resolveCheckoutLinePrice({
    quantity: 1,
    listUnitPrice: LIST_UNIT,
    previewLine: { originalPrice: LIST_UNIT, salePrice: SALE_UNIT },
    payableTotal: PAYABLE_UNIT,
    cartPromotionDiscount: CART_PROMO,
  });

  assert.equal(fromCart.productTotal, SALE_UNIT);
  assert.equal(fromPreview.productTotal, SALE_UNIT);
  assert.equal(fromCart.productTotal, fromPreview.productTotal);
  assert.equal(fromCart.productDiscountPercent, 50);
  // پرداختی نهایی، همان تفاضل قیمت سطح محصول و تخفیف سبد است
  assert.equal(fromCart.productTotal - CART_PROMO, PAYABLE_UNIT);
});

test('E: تعداد بیشتر از یک هم قیمت سطح محصول را درست جمع می‌زند', () => {
  const price = resolveCheckoutLinePrice({
    quantity: 2,
    listUnitPrice: LIST_UNIT,
    saleTotal: SALE_UNIT * 2,
    payableTotal: PAYABLE_UNIT * 2,
    cartPromotionDiscount: CART_PROMO * 2,
  });

  assert.equal(price.productTotal, SALE_UNIT * 2);
  assert.equal(price.listTotal, LIST_UNIT * 2);
  assert.equal(price.unitProductPrice, SALE_UNIT);
});

test('E: ردیف هدیهٔ رایگان قیمت سطح محصول صفر دارد', () => {
  const price = resolveCheckoutLinePrice({
    quantity: 1,
    listUnitPrice: LIST_UNIT,
    saleTotal: SALE_UNIT,
    payableTotal: 0,
    cartPromotionDiscount: SALE_UNIT,
    isFreeReward: true,
  });

  assert.equal(price.productTotal, 0);
});
