import assert from 'node:assert/strict';
import { test } from 'node:test';

import { normalizeSku } from './sku';

test('normalizeSku trims surrounding whitespace', () => {
  assert.equal(normalizeSku('  ABC-123  '), 'ABC-123');
});

test('normalizeSku converts Persian and Arabic digits to latin', () => {
  assert.equal(normalizeSku('۱۲۳۴۵۶۷۸۹۰'), '1234567890');
  assert.equal(normalizeSku('٠١٢٣٤٥٦٧٨٩'), '0123456789');
});

test('normalizeSku treats empty values as an empty string', () => {
  assert.equal(normalizeSku(undefined), '');
  assert.equal(normalizeSku(null), '');
  assert.equal(normalizeSku('   '), '');
});

test('normalizeSku returns the same value for an already normalized code', () => {
  assert.equal(normalizeSku('R-2024-01'), 'R-2024-01');
});
