import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  mergeUniqueProducts,
  productBasePrice,
  productDiscountPercent,
  productFinalPrice,
  productHasDiscount,
  productInStock,
  productSubcategory,
  selectBiggestDiscounts,
  toProductCardData,
} from '../lib/blackfriday/products';
import type { CategoriesResponse } from '../services/features/categories/types';
import {
  DiscountType,
  type ProductDiscount,
} from '../services/features/discounts/types';
import type {
  ProductsResponse,
  VariantResponse,
} from '../services/features/products/type';

type Draft = {
  id: number;
  /** قیمت پایهٔ واریانت */
  price?: number | string;
  stock?: number | string;
  /** درصد تخفیفِ اعمال‌شده (قیمت نهایی از آن ساخته می‌شود) */
  percent?: number;
  /** مقدار `effectivePercent` سرور؛ `undefined` یعنی سرور نفرستاده */
  effectivePercent?: number | null;
  /** مقدار دستی قیمت نهایی برای سناریوهای ناهماهنگ */
  finalPrice?: number;
  subcategory?: { id: number; name: string };
  title?: string;
  slug?: string;
};

function makeProduct(draft: Draft): ProductsResponse {
  const price = Number(draft.price ?? 1_000_000);
  const percent = draft.percent ?? 0;
  const finalPrice =
    draft.finalPrice ?? Math.round(price * (1 - percent / 100));

  const discount: ProductDiscount | undefined =
    percent > 0 || draft.finalPrice !== undefined
      ? {
          id: Math.round(percent),
          code: null,
          title: null,
          type: DiscountType.PERCENTAGE,
          value: percent,
          maxDiscountAmount: null,
          discountAmount: price - finalPrice,
          originalPrice: price,
          finalPrice,
          expiresAt: '2026-11-30T20:30:00.000Z',
          stages: [],
          stacked: false,
          ...(draft.effectivePercent === undefined
            ? {}
            : { effectivePercent: draft.effectivePercent as number }),
        }
      : undefined;

  const category = draft.subcategory
    ? ([
        {
          id: draft.subcategory.id,
          name: draft.subcategory.name,
          slug: `category-${draft.subcategory.id}`,
        } as CategoriesResponse,
      ] as CategoriesResponse[])
    : [];

  return {
    id: draft.id,
    productCode: `P-${draft.id}`,
    title: draft.title ?? `محصول ${draft.id}`,
    slug: draft.slug ?? `product-${draft.id}`,
    image: `images/${draft.id}.webp`,
    description: '',
    careInstructionsHtml: '',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    suggestedProducts: [],
    categories: category,
    variants: [
      {
        id: draft.id,
        price,
        stock: draft.stock ?? 3,
        color: { id: 1, name: 'مشکی', hexCode: '#000000' },
        size: { id: 1, name: 'M' },
      } as VariantResponse,
    ],
    comments: [],
    colorImages: [],
    sameColorProducts: [],
    ...(discount ? { discount } : {}),
  } as ProductsResponse;
}

/** مولد شبه‌تصادفی قطعی برای تست انتخاب */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('effectivePercent of the API wins over price math', () => {
  const product = makeProduct({
    id: 1,
    price: 1_000_000,
    percent: 10,
    effectivePercent: 25.4,
  });

  assert.equal(productDiscountPercent(product), 25);
});

test('discount percent falls back to real prices when effectivePercent is missing or invalid', () => {
  const missing = makeProduct({ id: 2, price: 1_000_000, percent: 10 });
  assert.equal(productDiscountPercent(missing), 10);

  const zero = makeProduct({
    id: 3,
    price: 1_000_000,
    percent: 40,
    effectivePercent: 0,
  });
  assert.equal(productDiscountPercent(zero), 40);

  const nan = makeProduct({
    id: 4,
    price: 1_000_000,
    percent: 30,
    effectivePercent: Number.NaN,
  });
  assert.equal(productDiscountPercent(nan), 30);
});

test('prices may arrive as decimal strings and still convert safely', () => {
  const product = makeProduct({ id: 5, price: '9980000.00', percent: 20 });

  assert.equal(productBasePrice(product), 9_980_000);
  assert.equal(productFinalPrice(product), 7_984_000);
  assert.equal(productDiscountPercent(product), 20);
});

test('products without a real discount are excluded', () => {
  const noDiscount = makeProduct({ id: 6, price: 1_000_000 });
  assert.equal(productHasDiscount(noDiscount), false);
  assert.equal(productDiscountPercent(noDiscount), 0);

  const broken = makeProduct({ id: 7, price: 1_000_000, finalPrice: 1_000_000 });
  assert.equal(productHasDiscount(broken), false);

  // قیمت نهایی بالاتر از پایه (تخفیف نامعتبر) هم تخفیف حساب نمی‌شود
  const invalid = makeProduct({ id: 8, price: 1_000_000, finalPrice: 1_100_000 });
  assert.equal(productHasDiscount(invalid), false);
});

test('stock follows the storefront rule: any variant with stock > 0', () => {
  const available = makeProduct({ id: 9, stock: '2.00' });
  assert.equal(productInStock(available), true);

  const unavailable = makeProduct({ id: 10, stock: 0 });
  assert.equal(productInStock(unavailable), false);
});

test('card data keeps the production ProductCard contract', () => {
  const product = makeProduct({
    id: 11,
    price: 2_000_000,
    percent: 50,
    subcategory: { id: 140, name: 'شلوار' },
  });

  const card = toProductCardData(product);

  assert.equal(card.id, 11);
  assert.equal(card.slug, 'product-11');
  assert.equal(card.image, 'images/11.webp');
  assert.equal(card.price, 2_000_000);
  assert.equal(card.subtitle, 'شلوار');
  assert.equal(card.discount?.finalPrice, 1_000_000);
  assert.equal(productSubcategory(product)?.id, 140);
});

test('biggest discounts: exactly six, real discounts only, ranked descending', () => {
  const products = [
    makeProduct({ id: 101, percent: 70, subcategory: { id: 138, name: 'پیراهن کلاسیک' } }),
    makeProduct({ id: 102, percent: 70, subcategory: { id: 138, name: 'پیراهن کلاسیک' } }),
    makeProduct({ id: 103, percent: 60, subcategory: { id: 139, name: 'پیراهن کژوال' } }),
    makeProduct({ id: 104, percent: 55, subcategory: { id: 140, name: 'شلوار' } }),
    makeProduct({ id: 105, percent: 45, subcategory: { id: 141, name: 'کت تک' } }),
    makeProduct({ id: 106, percent: 35, subcategory: { id: 142, name: 'پالتو' } }),
    makeProduct({ id: 107, percent: 20, subcategory: { id: 140, name: 'شلوار' } }),
    makeProduct({ id: 108, percent: 0, subcategory: { id: 140, name: 'شلوار' } }),
    makeProduct({ id: 109, percent: 90, stock: 0, subcategory: { id: 138, name: 'پیراهن کلاسیک' } }),
  ];

  const selected = selectBiggestDiscounts(products, 6, seeded(7));

  assert.equal(selected.length, 6);
  assert.equal(new Set(selected.map(item => item.id)).size, 6);
  assert.ok(selected.every(item => productHasDiscount(item)));
  assert.ok(selected.every(item => productInStock(item)));
  assert.ok(!selected.some(item => item.id === 108 || item.id === 109));

  const percents = selected.map(productDiscountPercent);
  assert.deepEqual(
    percents,
    [...percents].sort((left, right) => right - left),
    'cards must be shown from the highest discount down',
  );
});

test('biggest discounts prioritise subcategory diversity', () => {
  const subcategories = [
    { id: 138, name: 'پیراهن کلاسیک' },
    { id: 139, name: 'پیراهن کژوال' },
    { id: 140, name: 'شلوار' },
    { id: 141, name: 'کت تک' },
    { id: 142, name: 'پالتو' },
  ];
  const products = subcategories.flatMap((subcategory, index) => [
    makeProduct({ id: 201 + index * 2, percent: 70, subcategory }),
    makeProduct({ id: 202 + index * 2, percent: 65, subcategory }),
  ]);

  const selected = selectBiggestDiscounts(products, 6, seeded(11));
  const categories = selected.map(item => productSubcategory(item)?.id);

  // با شش جای خالی و پنج زیردسته، هر پنج زیردسته نماینده دارند.
  assert.equal(selected.length, 6);
  assert.equal(new Set(categories).size, 5);
  // اولویت تخفیف حفظ می‌شود: هیچ کارتی جای محصولی با تخفیف بالاتر را نمی‌گیرد
  // مگر آنکه آن محصول از زیردستهٔ تکراری باشد.
  const selectedIds = new Set(selected.map(item => item.id));
  const best = products.reduce((top, item) =>
    productDiscountPercent(item) > productDiscountPercent(top) ? item : top,
  );
  assert.ok(selectedIds.has(best.id));
});

test('comparable top discounts vary between page loads but never repeat', () => {
  const products = Array.from({ length: 12 }, (_, index) =>
    makeProduct({
      id: 300 + index,
      percent: 60,
      subcategory: { id: 138 + (index % 5), name: `دسته ${index % 5}` },
    }),
  );

  const first = selectBiggestDiscounts(products, 6, seeded(1)).map(item => item.id);
  const second = selectBiggestDiscounts(products, 6, seeded(2)).map(item => item.id);
  const repeat = selectBiggestDiscounts(products, 6, seeded(1)).map(item => item.id);

  assert.equal(new Set(first).size, 6);
  assert.notDeepEqual(first, second, 'selection should vary across page loads');
  assert.deepEqual(first, repeat, 'same seed must be deterministic');
});

test('selection covers the whole category, not only the first API page', () => {
  // صفحهٔ اول: تخفیف‌های متوسط؛ صفحهٔ دوم: تخفیف‌های بالا
  const pageOne = Array.from({ length: 24 }, (_, index) =>
    makeProduct({ id: 400 + index, percent: 20, subcategory: { id: 138, name: 'پیراهن کلاسیک' } }),
  );
  const pageTwo = [
    makeProduct({ id: 500, percent: 70, subcategory: { id: 140, name: 'شلوار' } }),
    makeProduct({ id: 501, percent: 65, subcategory: { id: 141, name: 'کت تک' } }),
  ];

  const selected = selectBiggestDiscounts([...pageOne, ...pageTwo], 6, seeded(3));

  assert.equal(selected[0].id, 500);
  assert.equal(selected[1].id, 501);
});

test('merging pages removes duplicates and keeps order', () => {
  const first = makeProduct({ id: 1 });
  const second = makeProduct({ id: 2 });
  const duplicate = makeProduct({ id: 1, title: 'تکراری' });

  const merged = mergeUniqueProducts([[first, second], [duplicate]]);

  assert.deepEqual(
    merged.map(item => item.id),
    [1, 2],
  );
  assert.equal(merged[0].title, first.title);
});
