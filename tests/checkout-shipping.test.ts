import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import {
  calculateCheckoutShipping,
  FIXED_SHIPPING_COST_TOMAN,
  getFixedShippingCost,
  isFixedShippingMethod,
  POST_SHIPPING_COST_TOMAN,
  TIPAX_SHIPPING_COST_TOMAN,
} from '../components/pages/checkout/shipping';
import { ShippingMethod } from '../services/features/orders/type';

const items = [{ quantity: 2, variant: { price: 1_000_000 } }];

test('تیپاکس هزینهٔ ثابت ۲۵۰ هزار تومان دارد (دیگر پس‌کرایه نیست)', () => {
  assert.equal(TIPAX_SHIPPING_COST_TOMAN, 250_000);
  assert.equal(getFixedShippingCost(ShippingMethod.TIBAX), 250_000);
  assert.equal(isFixedShippingMethod(ShippingMethod.TIBAX), true);
  assert.equal(
    calculateCheckoutShipping(items, ShippingMethod.TIBAX, true).shippingCost,
    250_000,
  );
  // مثل پست: فقط پس از انتخاب آدرس و با سبد غیرخالی
  assert.equal(
    calculateCheckoutShipping(items, ShippingMethod.TIBAX, false).shippingCost,
    0,
  );
  assert.equal(
    calculateCheckoutShipping([], ShippingMethod.TIBAX, true).shippingCost,
    0,
  );
});

test('هزینهٔ بقیهٔ روش‌های ارسال تغییر نمی‌کند', () => {
  assert.equal(POST_SHIPPING_COST_TOMAN, 250_000);
  assert.equal(getFixedShippingCost(ShippingMethod.POST), 250_000);
  assert.equal(getFixedShippingCost(ShippingMethod.COURIER), 0);
  assert.equal(getFixedShippingCost(ShippingMethod.PICKUP), 0);
  assert.equal(getFixedShippingCost(undefined), 0);
  assert.equal(isFixedShippingMethod(ShippingMethod.COURIER), false);
  assert.equal(isFixedShippingMethod(ShippingMethod.PICKUP), false);
  assert.deepEqual(Object.keys(FIXED_SHIPPING_COST_TOMAN).sort(), [
    'post',
    'tibax',
  ]);
});

test('جدول هزینهٔ فرانت با بک‌اند یکی است', () => {
  const backend = readFileSync(
    resolve(__dirname, '../../back/src/order/shipping.ts'),
    'utf8',
  );
  assert.match(backend, /POST_SHIPPING_COST_TOMAN = 250_000/);
  assert.match(backend, /TIPAX_SHIPPING_COST_TOMAN = 250_000/);
  assert.match(
    backend,
    /\[ShippingMethod\.TIBAX\]:\s*TIPAX_SHIPPING_COST_TOMAN/,
  );
  assert.doesNotMatch(backend, /\[ShippingMethod\.COURIER\]/);
});

test('کارت تیپاکس مبلغ را نشان می‌دهد و پیک همچنان «هزینه با مشتری» است', () => {
  const source = readFileSync(
    resolve(__dirname, '../components/pages/checkout/checkout-form.tsx'),
    'utf8',
  );
  const tipaxStart = source.indexOf('value={ShippingMethod.TIBAX}');
  const courierStart = source.indexOf('value={ShippingMethod.COURIER}');
  assert.ok(tipaxStart > -1 && courierStart > -1);

  const tipaxCard = source.slice(tipaxStart, source.indexOf('</label>', tipaxStart));
  const courierCard = source.slice(
    courierStart,
    source.indexOf('</label>', courierStart),
  );

  assert.match(tipaxCard, /TIPAX_SHIPPING_COST_TOMAN\.toLocaleString\('fa-IR'\)/);
  assert.doesNotMatch(tipaxCard, /هزینه با مشتری/);
  assert.match(courierCard, /هزینه با مشتری/);

  // ارسال رایگانِ پروموشن روی همهٔ روش‌های با هزینهٔ ثابت (پست و تیپاکس) اعمال می‌شود
  assert.doesNotMatch(source, /selectedShipping === ShippingMethod\.POST &&/);
  assert.match(source, /isFixedShippingMethod\(selectedShipping\) &&/);
});
