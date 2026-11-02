import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import {
  DEFAULT_DELIVERY_METHOD,
  getDeliveryMethods,
  getDeliveryType,
  isCheckoutSubmittable,
  restoreDeliveryMethod,
} from '../components/pages/checkout/delivery';
import { ShippingMethod } from '../services/features/orders/type';

test('نوع تحویل از همان shippingMethod استنتاج میشود (بدون فیلد جدید)', () => {
  assert.equal(getDeliveryType(ShippingMethod.PICKUP), 'pickup');
  for (const method of [
    ShippingMethod.POST,
    ShippingMethod.COURIER,
    ShippingMethod.TIBAX,
  ]) {
    assert.equal(getDeliveryType(method), 'delivery');
  }
});

test('شاخه ارسال فقط روشهای قبلی را دارد و گزینه حضوری در آن تکرار نمیشود', () => {
  const methods = getDeliveryMethods();
  assert.deepEqual(methods, [ShippingMethod.POST, ShippingMethod.TIBAX]);
  assert.equal(methods.includes(ShippingMethod.PICKUP), false);

  const tehran = getDeliveryMethods('تهران');
  assert.equal(tehran.includes(ShippingMethod.COURIER), true);
  assert.equal(tehran.includes(ShippingMethod.PICKUP), false);
  assert.equal(getDeliveryMethods('کرمان').includes(ShippingMethod.COURIER), false);
});

test('برگشت از حضوری، آخرین روش ارسال را حفظ میکند مگر نامعتبر شده باشد', () => {
  assert.equal(
    restoreDeliveryMethod(ShippingMethod.TIBAX, getDeliveryMethods()),
    ShippingMethod.TIBAX,
  );
  assert.equal(
    restoreDeliveryMethod(ShippingMethod.COURIER, getDeliveryMethods('تهران')),
    ShippingMethod.COURIER,
  );
  // پیک بعد از تغییر آدرس به شهر غیرتهران دیگر در دسترس نیست
  assert.equal(
    restoreDeliveryMethod(ShippingMethod.COURIER, getDeliveryMethods('شیراز')),
    DEFAULT_DELIVERY_METHOD,
  );
});

test('ثبت سفارش حضوری بدون آدرس ممکن است (بازگشت باگ دکمه غیرفعال)', () => {
  const base = { hasGateway: true, walletFullyCovers: false };

  assert.equal(
    isCheckoutSubmittable({
      ...base,
      isPickup: true,
      hasSelectedAddress: false,
    }),
    true,
  );
  assert.equal(
    isCheckoutSubmittable({
      ...base,
      isPickup: false,
      hasSelectedAddress: false,
    }),
    false,
  );
  assert.equal(
    isCheckoutSubmittable({
      ...base,
      isPickup: false,
      hasSelectedAddress: true,
    }),
    true,
  );
  // حضوری همچنان به درگاه یا پوشش کامل کیف پول نیاز دارد
  assert.equal(
    isCheckoutSubmittable({
      isPickup: true,
      hasSelectedAddress: false,
      hasGateway: false,
      walletFullyCovers: false,
    }),
    false,
  );
  assert.equal(
    isCheckoutSubmittable({
      isPickup: true,
      hasSelectedAddress: false,
      hasGateway: false,
      walletFullyCovers: true,
    }),
    true,
  );
});

test('دو گزینه نحوه دریافت بالاتر از آدرس قرار دارند و حضوری بخش آدرس را مخفی میکند', () => {
  const source = readFileSync(
    resolve(__dirname, '../components/pages/checkout/checkout-form.tsx'),
    'utf8',
  );

  const sectionIndex = source.indexOf('نحوه دریافت');
  const addressIndex = source.indexOf('آدرس تحویل', sectionIndex);
  assert.ok(sectionIndex > -1, 'بخش نحوه دریافت وجود دارد');
  assert.ok(addressIndex > sectionIndex, 'انتخاب نحوه دریافت بالای آدرس است');

  assert.ok(source.includes('>دریافت حضوری<'), 'گزینه دریافت حضوری موجود است');
  assert.ok(source.includes('>ارسال<'), 'گزینه ارسال موجود است');

  const branchStart = source.indexOf('{isPickup ? (');
  const branchSeparator = source.indexOf(') : (\n              <>', branchStart);
  const branchEnd = source.indexOf('{/* ================================= */}\n            {/* کد تخفیف', branchStart);
  assert.ok(branchStart > -1 && branchSeparator > branchStart && branchEnd > branchSeparator);

  const pickupBranch = source.slice(branchStart, branchSeparator);
  const deliveryBranch = source.slice(branchSeparator, branchEnd);

  assert.match(pickupBranch, /تحویل حضوری در هدیش مال/);
  assert.doesNotMatch(pickupBranch, /<Addresses/);
  assert.match(deliveryBranch, /<Addresses/);
  assert.doesNotMatch(deliveryBranch, /تحویل حضوری در هدیش مال/);
  assert.match(deliveryBranch, /deliveryMethods\.includes\(ShippingMethod\.POST\)/);
});
