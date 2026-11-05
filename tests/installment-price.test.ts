import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatInstallment,
  selectedProductPrice,
} from '../components/pages/product/installment-price';
import type { VariantResponse } from '../services/features/products/type';

const variants = [
  {
    id: 1,
    color: { id: 1 },
    size: { id: 1 },
    price: 1000000,
    discountedPrice: 800000,
  },
  { id: 2, color: { id: 1 }, size: { id: 2 }, price: 1200000 },
  { id: 3, color: { id: 2 }, size: { id: 1 }, price: 0 },
] as VariantResponse[];

test('the estimate uses the selected variant and its discounted price', () => {
  assert.equal(selectedProductPrice(variants, 1, 1), 800000);
  assert.equal(formatInstallment(800000), '۲۰۰٬۰۰۰');
  assert.equal(selectedProductPrice(variants, 1, 2), 1200000);
  assert.equal(formatInstallment(1200000), '۳۰۰٬۰۰۰');
  assert.equal(formatInstallment(101), '۲۵٫۲۵');
  assert.equal(formatInstallment(100.01), '۲۵٫۰۰۲۵');
});

test('missing, zero and invalid prices are not advertised', () => {
  assert.equal(selectedProductPrice(variants, 2, 2), null);
  assert.equal(selectedProductPrice(variants, 2, 1), null);
  assert.equal(selectedProductPrice(undefined, 1, 1), null);
  assert.equal(
    selectedProductPrice([{ ...variants[0], discountedPrice: NaN }], 1, 1),
    null,
  );
});
