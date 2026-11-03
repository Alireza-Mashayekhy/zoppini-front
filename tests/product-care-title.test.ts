import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import ProductGuidesSheet from '../components/pages/product/product-guides';
import { careInstructionsLabel } from '../lib/care-instructions';
import type { ProductsResponse } from '../services/features/products/type';

const source = (path: string) =>
  readFileSync(resolve(__dirname, '..', path), 'utf8');

test('the chosen label is displayed and old products retain washing', () => {
  assert.equal(careInstructionsLabel('washing'), 'نحوه شستشو');
  assert.equal(careInstructionsLabel('maintenance'), 'نحوه نگهداری');
  assert.equal(careInstructionsLabel(undefined), 'نحوه شستشو');
  const guides = source('components/pages/product/product-guides.tsx');
  assert.match(
    guides,
    /careInstructionsLabel\(product\.careInstructionsTitle\)/,
  );
  assert.match(guides, /!hasSizeTable && !hasMeasurement && !hasCare/);
  assert.match(
    guides,
    /hasMeasurement\s*\? 'measurement'\s*: 'careInstructions'/,
  );
});

test('the admin editor restores and submits the per-product choice', () => {
  const form = source('components/admin/product/create-modal.tsx');
  assert.match(form, /product\.careInstructionsTitle === 'maintenance'/);
  assert.match(
    form,
    /formData\.append\('careInstructionsTitle', careInstructionsTitle\)/,
  );
  assert.match(form, /value: 'washing'/);
  assert.match(form, /value: 'maintenance'/);
});

test('care-only products still have an accessible product guide', () => {
  const product = {
    careInstructionsHtml: '<p>در جای خشک نگه دارید</p>',
    careInstructionsTitle: 'maintenance',
  } as ProductsResponse;
  const html = renderToStaticMarkup(
    createElement(ProductGuidesSheet, { product }),
  );
  assert.match(html, /راهنمای محصول/);
  assert.match(html, /aria-haspopup="dialog"/);
  const empty = renderToStaticMarkup(
    createElement(ProductGuidesSheet, {
      product: { ...product, careInstructionsHtml: '' },
    }),
  );
  assert.equal(empty, '');
});
