import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveIncomingVariant } from './rahkaran-variant';

const existing = [
  {
    id: 11,
    colorId: '1',
    sizeId: '3',
    price: 1_200_000,
    stock: 4,
    sku: '1111',
  },
  {
    id: 12,
    colorId: '1',
    sizeId: '4',
    price: 1_200_000,
    stock: 7,
    sku: '2222',
  },
];

test('keeps the product untouched when no rahkaran product is incoming', () => {
  const result = resolveIncomingVariant(existing, null);

  assert.equal(result.variants, existing);
  assert.deepEqual(result.pendingVariants, []);
  assert.equal(result.linked, null);
});

test('updates price and stock when the sku is already linked to this product', () => {
  const result = resolveIncomingVariant(existing, {
    productNumber: ' 2222 ',
    price: 1_500_000,
    stock: 12,
  });

  assert.deepEqual(result.pendingVariants, []);
  assert.deepEqual(result.linked, { sizeId: '4', variantId: 12 });

  const updated = result.variants.find(variant => variant.id === 12);
  assert.equal(updated?.price, 1_500_000);
  assert.equal(updated?.stock, 12);

  // بقیه واریانت‌ها دست‌نخورده می‌مانند
  assert.equal(result.variants.find(variant => variant.id === 11)?.stock, 4);
});

test('matches the incoming sku even when digits are Persian', () => {
  const result = resolveIncomingVariant(existing, {
    productNumber: '۲۲۲۲',
    price: 1_500_000,
    stock: 12,
  });

  assert.deepEqual(result.linked, { sizeId: '4', variantId: 12 });
  assert.deepEqual(result.pendingVariants, []);
});

test('creates a pending variant when the sku is new for this product', () => {
  const result = resolveIncomingVariant(existing, {
    productNumber: '3333',
    price: 990_000,
    stock: 2,
  });

  assert.equal(result.linked, null);
  assert.deepEqual(result.pendingVariants, [
    { sizeId: '', price: 990_000, stock: 2, sku: '3333' },
  ]);
  assert.deepEqual(result.variants, existing);
});

test('treats an empty incoming sku as a new variant', () => {
  const result = resolveIncomingVariant(existing, {
    productNumber: '   ',
    price: 500_000,
    stock: 0,
  });

  assert.equal(result.linked, null);
  assert.equal(result.pendingVariants.length, 1);
});
