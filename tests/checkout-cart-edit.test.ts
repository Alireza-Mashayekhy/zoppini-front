import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import OrderSummary from '../components/pages/checkout/order-summary';
import type { CartItem } from '../services/features/cart/types';

process.env.NEXT_PUBLIC_IMAGE_URL = '';

const source = (path: string) =>
  readFileSync(resolve(__dirname, '..', path), 'utf8');

const item = (id: number, quantity: number, stock: number) =>
  ({
    id,
    quantity,
    variant: {
      id: id * 10,
      price: 1000000,
      originalPrice: 1000000,
      discountedPrice: 1000000,
      discount: 0,
      stock,
      color: { name: 'مشکی' },
      size: { name: 'M' },
      product: { title: `محصول ${id}`, image: '/x.webp', slug: `p-${id}` },
    },
  }) as unknown as CartItem;

const baseProps = {
  appliedDiscount: null,
  shippingCost: 0,
  isFreeShipping: true,
  hasSelectedAddress: false,
  isPickup: true,
  pricing: null,
  onQuantityChange: () => {},
  onRemoveItem: () => {},
};

const render = (items: CartItem[], isUpdatingCart = false) =>
  renderToStaticMarkup(
    createElement(OrderSummary, {
      ...baseProps,
      items,
      isUpdatingCart,
    }),
  );

test('هر آیتم خلاصه سفارش کنترل کم/زیاد و حذف دارد', () => {
  const html = render([item(1, 2, 10)]);

  assert.match(html, /aria-label="کاهش تعداد"/);
  assert.match(html, /aria-label="افزایش تعداد"/);
  assert.match(html, /aria-label="حذف از سبد خرید"/);
  assert.doesNotMatch(html, /×/);
});

test('دکمه افزایش وقتی به موجودی برسد غیرفعال است', () => {
  const atStock = render([item(1, 3, 3)]);
  const plusAtStock = atStock.match(
    /<button[^>]*aria-label="افزایش تعداد"[^>]*>/,
  );
  assert.ok(plusAtStock);
  assert.match(plusAtStock[0], /disabled=""/);

  const belowStock = render([item(1, 2, 3)]);
  const plusBelow = belowStock.match(
    /<button[^>]*aria-label="افزایش تعداد"[^>]*>/,
  );
  assert.ok(plusBelow);
  assert.doesNotMatch(plusBelow[0], /disabled=""/);
});

test('وقتی تغییر سبد در جریان است همه کنترل‌ها غیرفعال می‌شوند', () => {
  const html = render([item(1, 1, 10)], true);
  const buttons = html.match(/<button[^>]*>/g) ?? [];
  const controls = buttons.filter(b => /aria-label="(کاهش|افزایش|حذف)/.test(b));

  assert.equal(controls.length, 3);
  for (const control of controls) {
    assert.match(control, /disabled=""/);
  }
});

test('صفحه تسویه تغییرات سبد را به خلاصه سفارش وصل می‌کند', () => {
  const form = source('components/pages/checkout/checkout-form.tsx');

  assert.match(form, /useUpdateCartItem\(\)/);
  assert.match(form, /useDeleteCartItem\(\)/);
  assert.match(form, /quantity < 1[\s\S]*deleteCartItem\.mutateAsync/);
  assert.match(form, /onQuantityChange=\{handleQuantityChange\}/);
  assert.match(form, /onRemoveItem=\{handleRemoveCartItem\}/);
  // کد تخفیف بعد از هر تغییر سبد دوباره روی سبد جدید بررسی می‌شود
  assert.match(form, /reapplyDiscount\(\)/);
  assert.match(form, /applyDiscountMutation\.mutateAsync\(\{ code \}\)/);
});
