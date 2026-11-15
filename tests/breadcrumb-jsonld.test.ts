import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildBreadcrumbJsonLd } from '../lib/jsonld/breadcrumb';

test('breadcrumb items are emitted as absolute canonical URLs', () => {
  const schema = buildBreadcrumbJsonLd([
    { name: 'خانه', href: '/' },
    { name: 'پیراهن مردانه', href: '/product-category/shirt' },
    { name: 'پیراهن لنین', href: '/product/shirt-630' },
  ]);

  assert.ok(schema);
  assert.equal(schema['@type'], 'BreadcrumbList');

  const items = schema.itemListElement as Record<string, unknown>[];

  assert.equal(items[0].item, 'https://zoppinico.com');
  assert.equal(items[1].item, 'https://zoppinico.com/product-category/shirt');
  assert.equal(items[2].item, 'https://zoppinico.com/product/shirt-630');
});

test('positions are sequential starting at 1', () => {
  const schema = buildBreadcrumbJsonLd([
    { name: 'خانه', href: '/' },
    { name: 'کت و شلوار', href: '/product-category/suit' },
    { name: 'کت تک', href: '/product/suit-1' },
  ]);

  const items = schema?.itemListElement as Record<string, unknown>[];

  assert.deepEqual(items.map(item => item.position), [1, 2, 3]);
  assert.deepEqual(items.map(item => item.name), [
    'خانه',
    'کت و شلوار',
    'کت تک',
  ]);
});

test('home item never gets a trailing slash', () => {
  const schema = buildBreadcrumbJsonLd([
    { name: 'خانه', href: '/' },
    { name: 'محصولات', href: '/products' },
  ]);

  const items = schema?.itemListElement as Record<string, unknown>[];

  assert.equal(items[0].item, 'https://zoppinico.com');
});

test('invalid or empty items are dropped and positions renumbered', () => {
  const schema = buildBreadcrumbJsonLd([
    { name: 'خانه', href: '/' },
    { name: '', href: '/product-category/shirt' },
    { name: 'بدون آدرس', href: '' },
    { name: 'پیراهن', href: '/product/shirt-630' },
  ]);

  const items = schema?.itemListElement as Record<string, unknown>[];

  assert.equal(items.length, 2);
  assert.deepEqual(items.map(item => item.position), [1, 2]);
  assert.equal(items[1].name, 'پیراهن');
});

test('duplicate consecutive items are not emitted twice', () => {
  const schema = buildBreadcrumbJsonLd([
    { name: 'خانه', href: '/' },
    { name: 'خانه', href: '/' },
    { name: 'محصولات', href: '/products' },
  ]);

  const items = schema?.itemListElement as Record<string, unknown>[];

  assert.equal(items.length, 2);
});

test('a single valid item is not a breadcrumb trail', () => {
  assert.equal(buildBreadcrumbJsonLd([{ name: 'خانه', href: '/' }]), null);
  assert.equal(buildBreadcrumbJsonLd([]), null);
  assert.equal(buildBreadcrumbJsonLd(null), null);
});
