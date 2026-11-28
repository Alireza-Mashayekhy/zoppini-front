import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  deriveBlackFridayCollection,
  discountStillValid,
} from '../lib/blackfriday/collection';
import { toProductCardData } from '../lib/blackfriday/products';
import {
  parseRecoveryPayload,
  RECOVERY_ENDPOINT,
  shouldAcceptRecovery,
} from '../lib/blackfriday/recovery';
import { slimProductForListing } from '../lib/blackfriday/slim';
import type { CategoriesResponse } from '../services/features/categories/types';
import { DiscountType } from '../services/features/discounts/types';
import type { ProductsResponse } from '../services/features/products/type';

const NOW = Date.parse('2026-11-28T12:00:00Z');
const LONG_TEXT = 'بلک فرایدی '.repeat(800);

function category(id: number, parentId: number | null): CategoriesResponse {
  return {
    id,
    name: `cat-${id}`,
    slug: `cat-${id}`,
    parentId,
    description: LONG_TEXT,
    secondImages: ['a.webp'],
  } as unknown as CategoriesResponse;
}

function product(
  id: number,
  percent: number,
  {
    stock = 2,
    categories = [category(137, null), category(138, 137)],
    expiresAt = '2026-11-29T20:30:00.000Z',
  }: {
    stock?: number;
    categories?: CategoriesResponse[];
    expiresAt?: string;
  } = {},
): ProductsResponse {
  const price = 10_000_000;
  const finalPrice = Math.round(price * (1 - percent / 100));
  return {
    id,
    productCode: String(id),
    title: `p${id}`,
    slug: `p${id}`,
    image: `${id}.webp`,
    description: LONG_TEXT,
    careInstructionsHtml: LONG_TEXT,
    suggestedProducts: [],
    sameColorProducts: [],
    createdAt: '2026-11-26T11:33:13.000Z',
    categories,
    variants: [
      {
        id: id * 10,
        productId: id,
        colorId: 1,
        sizeId: 2,
        price,
        stock,
        color: { id: 1, name: 'black', hexCode: '#000' },
        size: { id: 2, name: '48' },
      },
    ],
    colorImages: [],
    discount:
      percent > 0
        ? {
            id: percent,
            code: null,
            title: 'sale',
            type: DiscountType.PERCENTAGE,
            value: percent,
            maxDiscountAmount: null,
            discountAmount: price - finalPrice,
            originalPrice: price,
            finalPrice,
            expiresAt,
            stages: [],
            stacked: false,
            effectivePercent: percent,
          }
        : null,
    promotionBadge: null,
    extraDiscountBadge: null,
  } as unknown as ProductsResponse;
}

const shirtRoot = category(64, null);
const allCategories = [
  category(137, null),
  category(138, 137),
  shirtRoot,
  category(75, 64),
];

test('derive keeps the campaign rules: 70% members + exactly-20% store-wide, in stock only', () => {
  const member70 = product(1, 70);
  const member20 = product(2, 20);
  const outsider20 = product(3, 20, { categories: [shirtRoot] });
  const outsider70 = product(4, 70, { categories: [shirtRoot] });
  const member50 = product(5, 50);
  const soldOut70 = product(6, 70, { stock: 0 });

  const result = deriveBlackFridayCollection({
    campaignProducts: [member70, member20, member50, soldOut70],
    discountedProducts: [
      member70,
      member20,
      outsider20,
      outsider70,
      member50,
      soldOut70,
    ],
    categories: allCategories,
    now: NOW,
  });

  assert.equal(result.unavailable, false);
  assert.deepEqual(
    result.eligibleProducts.map(item => item.id).sort(),
    [1, 2, 3],
  );
});

test('derive reports unavailable (not "no products") when either listing is missing', () => {
  for (const [campaign, discounted] of [
    [null, [product(1, 70)]],
    [[product(1, 70)], null],
  ] as const) {
    const result = deriveBlackFridayCollection({
      campaignProducts: campaign as ProductsResponse[] | null,
      discountedProducts: discounted as ProductsResponse[] | null,
      categories: allCategories,
      now: NOW,
    });
    assert.equal(result.unavailable, true);
    assert.equal(result.eligibleProducts.length, 0);
  }
});

test('a last-known-good snapshot never shows a discount that has already expired', () => {
  const expired = product(1, 70, { expiresAt: '2026-11-28T11:59:59Z' });
  const valid = product(2, 70);
  assert.equal(discountStillValid(expired, NOW), false);
  assert.equal(discountStillValid(valid, NOW), true);

  const result = deriveBlackFridayCollection({
    campaignProducts: [expired, valid],
    discountedProducts: [expired, valid],
    categories: allCategories,
    now: NOW,
  });
  assert.deepEqual(result.eligibleProducts.map(item => item.id), [2]);
  assert.deepEqual(result.campaignProducts.map(item => item.id), [2]);
});

test('collection categories keep the tree but drop SEO articles', () => {
  const result = deriveBlackFridayCollection({
    campaignProducts: [product(1, 70)],
    discountedProducts: [product(1, 70)],
    categories: allCategories,
    now: NOW,
  });
  assert.deepEqual(
    result.collectionCategories.map(item => [item.id, item.parentId]),
    [
      [137, null],
      [138, 137],
    ],
  );
  assert.ok(result.collectionCategories.every(item => item.description === ''));
});

test('slimming removes heavy text but leaves the product card data identical', () => {
  const full = product(1, 70);
  const slim = slimProductForListing(full);

  assert.deepEqual(toProductCardData(slim), toProductCardData(full));
  assert.deepEqual(slim.variants, full.variants);
  assert.deepEqual(slim.discount, full.discount);
  assert.deepEqual(
    slim.categories.map(item => [item.id, item.name, item.parentId]),
    full.categories.map(item => [item.id, item.name, item.parentId]),
  );
  assert.equal(slim.description, '');
  assert.equal(
    Object.prototype.hasOwnProperty.call(slim, 'careInstructionsHtml'),
    false,
  );
  assert.ok(slim.categories.every(item => item.description === ''));
  assert.ok(
    JSON.stringify(slim).length < JSON.stringify(full).length / 5,
    'slim payload should be much smaller',
  );
});

test('recovery only replaces the list with valid data, never with an empty/unavailable answer', () => {
  const shown = [product(1, 70)];
  const valid = parseRecoveryPayload({
    products: [product(2, 20)],
    categories: [],
    unavailable: false,
    state: 'fresh',
  });
  const empty = parseRecoveryPayload({
    products: [],
    categories: [],
    unavailable: false,
  });
  const unavailable = parseRecoveryPayload({
    products: [],
    categories: [],
    unavailable: true,
  });

  assert.equal(shouldAcceptRecovery([], valid), true);
  assert.equal(shouldAcceptRecovery(shown, valid), true);
  assert.equal(shouldAcceptRecovery(shown, empty), false);
  assert.equal(shouldAcceptRecovery([], empty), true); // authoritative empty
  assert.equal(shouldAcceptRecovery([], unavailable), false);
  assert.equal(shouldAcceptRecovery([], null), false);
  assert.equal(parseRecoveryPayload('<html>502</html>'), null);
  assert.equal(parseRecoveryPayload({ products: 'x' }), null);
});

const read = (path: string) =>
  readFileSync(join(__dirname, '..', path), 'utf8');

test('landing page and recovery endpoint share the snapshot source; no per-request full scans', () => {
  const page = read('app/landing/blackfriday/page.tsx');
  const route = read('app/landing/blackfriday/products/route.ts');
  assert.match(page, /getBlackFridayCollectionData\(\)/);
  assert.doesNotMatch(page, /loadDiscountedProducts|loadBlackFridayCatalog/);
  assert.match(route, /getBlackFridayCollectionData\(\{\s*maxWaitMs: RECOVERY_COLD_WAIT_MS/);
  assert.match(route, /'Cache-Control': 'no-store'/);
  // Served by Next, not shadowed by the backend's /api/* proxy.
  assert.equal(RECOVERY_ENDPOINT, '/landing/blackfriday/products');
});

test('the collection retries in place instead of a full router.refresh()', () => {
  const collection = read('components/pages/blackfriday/product-collection.tsx');
  assert.match(collection, /useBlackFridayRecovery\(/);
  assert.match(collection, /onClick=\{recovery\.retry\}/);
  assert.doesNotMatch(collection, /router\.refresh\(\)/);
});

test('page and recovery route share one process-wide snapshot (not per-bundle module state)', () => {
  const source = read('lib/blackfriday/collection-source.ts');
  assert.match(source, /Symbol\.for\('zoppini\.blackfriday\.collectionStores'\)/);
  assert.match(source, /registry\[STORES_KEY\] \?\?=/);
});
