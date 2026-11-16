import assert from 'node:assert/strict';
import { test } from 'node:test';

import { discountPercent, formatPriceFa } from '../lib/discount';

test(' computes whole percents', () => {
  assert.equal(discountPercent(1000000, 800000), 20);
  assert.equal(discountPercent(2000000, 1500000), 25);
});

test('٪invalid discounts return null (no badge should be shown)', () => {
  // قیمت‌های پایه و تخفیف نامعتبر
  assert.equal(discountPercent(0, 800000), null);
  assert.equal(discountPercent(1000000, 0), null);
  // تخفیف صفر
  assert.equal(discountPercent(1000000, 1000000), null);
  // تخفیفی که بالاتر از قیمت پایه است
  assert.equal(discountPercent(1000000, 1200000), null);
  // ورودی‌های نامعتبر رشته‌ای (مثلاً از API شکسته)
  assert.equal(discountPercent('1000000', '800000'), 20);
  assert.equal(discountPercent('not a number', '800000'), null);
});

test('values rounded to nearest integer', () => {
  assert.equal(discountPercent(1000000, 850501), 15);
  assert.equal(discountPercent(1000000, 850499), 15);
});

test('formatted as Persian digits', () => {
  assert.equal(formatPriceFa(1000000), '۱٬۰۰۰٬۰۰۰');
  assert.equal(formatPriceFa(850000), '۸۵۰٬۰۰۰');
  assert.equal(formatPriceFa('1000000'), '۱٬۰۰۰٬۰۰۰');
  // اعداد نامعتبر/منفی به رشتهٔ خالی می‌روند تا صفحه از crash جلوگیری کند
  assert.equal(formatPriceFa(NaN), '');
  assert.equal(formatPriceFa(0), '');
  assert.equal(formatPriceFa(-5), '');
});
