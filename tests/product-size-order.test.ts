import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sortSizeOptions } from '../lib/product-size-order';

const names = (sizes: { id: number; name: string }[]) =>
  sortSizeOptions(sizes).map(size => size.name);

test('سایزهای عددی به ترتیب عددی (نه id) مرتب می‌شوند', () => {
  const sizes = [
    { id: 1, name: '48' },
    { id: 2, name: '42' },
    { id: 3, name: '46' },
    { id: 4, name: '40' },
    { id: 5, name: '44' },
  ];

  assert.deepEqual(names(sizes), ['40', '42', '44', '46', '48']);
});

test('سایزهای حروفی به ترتیب متعارف مرتب می‌شوند', () => {
  const sizes = [
    { id: 1, name: 'XL' },
    { id: 2, name: 'S' },
    { id: 3, name: '3XL' },
    { id: 4, name: 'M' },
    { id: 5, name: 'L' },
    { id: 6, name: 'XXL' },
    { id: 7, name: 'XS' },
  ];

  assert.deepEqual(names(sizes), ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']);
});

test('در فهرست «همه محصولات» عددی‌ها قبل از حروفی‌ها می‌آیند', () => {
  const sizes = [
    { id: 1, name: 'L' },
    { id: 2, name: '46' },
    { id: 3, name: 'S' },
    { id: 4, name: '40' },
  ];

  assert.deepEqual(names(sizes), ['40', '46', 'S', 'L']);
});

test('ارقام فارسی هم به‌عنوان عدد شناخته می‌شوند', () => {
  const sizes = [
    { id: 1, name: '۴۶' },
    { id: 2, name: '۴۰' },
    { id: 3, name: '۴۴' },
  ];

  assert.deepEqual(names(sizes), ['۴۰', '۴۴', '۴۶']);
});

test('سایزهای ناشناخته حذف نمی‌شوند و آخر می‌آیند', () => {
  const result = names([
    { id: 1, name: 'FREE SIZE' },
    { id: 2, name: 'M' },
    { id: 3, name: 'ویژه' },
  ]);

  assert.deepEqual(result, ['M', 'FREE SIZE', 'ویژه']);
});
