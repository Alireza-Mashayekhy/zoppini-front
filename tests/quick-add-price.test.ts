import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import { formatPriceFa } from '../lib/discount';

/**
 * مودال خرید سریع (quick-add): قیمت دیگر به‌صورت
 * `9800000.00` نمایش داده نمی‌شود — بخش اعشاری حذف و جداکننده‌ی
 * هزارگانِ فارسی اضافه شده است.
 */

const dialogSrc = readFileSync(
  resolve(__dirname, '../components/shared/quick-add-dialog.tsx'),
  'utf-8',
);

test('prices inside the quick-add dialog are coerced to numbers before comparison/display', () => {
  assert.match(dialogSrc, /Number\(variant\?\.price/);
  assert.match(dialogSrc, /Number\(product\.discount\?\.finalPrice\)/);
  assert.match(dialogSrc, /Number\(variant\?\.discountedPrice\)/);
});

test('prices inside the quick-add dialog use Persian grouping (no bare toLocaleString on raw strings)', () => {
  assert.match(dialogSrc, /formatPriceFa\(basePrice\)/);
  assert.match(dialogSrc, /formatPriceFa\(finalPrice\)/);
  assert.doesNotMatch(dialogSrc, /basePrice\.toLocaleString\(\)/);
  assert.doesNotMatch(dialogSrc, /finalPrice\.toLocaleString\(\)/);
});

test('API decimal strings render without the trailing .00 and with thousands separators', () => {
  // ورودی واقعی API برای ستون‌های decimal
  assert.equal(formatPriceFa('9800000.00'), '۹٬۸۰۰٬۰۰۰');
  assert.equal(formatPriceFa('125000.50'), '۱۲۵٬۰۰۱');
  // عددهای معمولی هم همین رفتار را دارند
  assert.equal(formatPriceFa(9800000), '۹٬۸۰۰٬۰۰۰');
});
