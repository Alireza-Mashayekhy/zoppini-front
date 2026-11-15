import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildProductJsonLd, RIALS_PER_TOMAN } from '../lib/jsonld/product';
import { discountExpiresAt, effectivePrice, isDiscounted, resolveDisplayVariant } from '../lib/product-price';

/** یک تاریخِ مطمئناً آینده برای تست‌های انقضا. */
const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

function offers(schema: Record<string, unknown> | null) {
  assert.ok(schema, 'schema must be rendered');
  const value = schema.offers as Record<string, unknown>;
  assert.ok(value, 'offers must exist');
  return value;
}

test('a discounted variant publishes the discounted price, not the base price', () => {
  // ۱۲٬۸۰۰٬۰۰۰ تومان با ۵۰٪ تخفیف → ۶٬۴۰۰٬۰۰۰ تومان = ۶۴٬۰۰۰٬۰۰۰ ریال
  const schema = buildProductJsonLd({
    title: 'شلوار کلاسیک مردانه',
    slug: 'mens-classic-trousers-zoppini0040465',
    variants: [
      {
        price: '12800000.00',
        discountedPrice: 6400000,
        stock: 2,
        discountExpiresAt: FUTURE,
      },
    ],
  });

  const offer = offers(schema);

  assert.equal(offer.priceCurrency, 'IRR');
  assert.equal(offer.price, 6400000 * RIALS_PER_TOMAN);
  assert.equal(offer.priceValidUntil, FUTURE);
});

test('a non-discounted variant publishes the base price without priceValidUntil', () => {
  const schema = buildProductJsonLd({
    title: 'شلوار کلاسیک مردانه',
    slug: 'mens-classic-trousers-zoppini0040465',
    variants: [{ price: '12800000.00', stock: 2 }],
  });

  const offer = offers(schema);

  assert.equal(offer.price, 12800000 * RIALS_PER_TOMAN);
  assert.equal('priceValidUntil' in offer, false);
});

test('the displayed variant wins over the cheapest one (no min-price fallback)', () => {
  // اولین variant گران‌تر است و همان است که صفحه نمایش می‌دهد؛
  // کمترین قیمت ۵٬۰۰۰٬۰۰۰ است اما نباید منتشر شود.
  const schema = buildProductJsonLd({
    title: 'کت تک',
    slug: 'blazer',
    variants: [
      { price: 9900000, stock: 1 },
      { price: 5000000, stock: 1 },
    ],
  });

  assert.equal(offers(schema).price, 9900000 * RIALS_PER_TOMAN);
});

test('an explicit selection overrides the first variant', () => {
  const variants = [
    { price: 9900000, stock: 1, color: { id: 1 }, size: { id: 10 } },
    { price: 7500000, stock: 1, color: { id: 2 }, size: { id: 20 } },
  ];

  const schema = buildProductJsonLd({
    title: 'کت تک',
    slug: 'blazer',
    variants,
    selection: { colorId: 2, sizeId: 20 },
  });

  assert.equal(offers(schema).price, 7500000 * RIALS_PER_TOMAN);
});

test('a missing discounted price falls back to the base price', () => {
  const schema = buildProductJsonLd({
    title: 'پیراهن',
    slug: 'shirt',
    variants: [{ price: 4500000, discountedPrice: null, stock: 1 }],
  });

  assert.equal(offers(schema).price, 4500000 * RIALS_PER_TOMAN);
  assert.equal('priceValidUntil' in offers(schema), false);
});

test('an invalid (zero/NaN) discounted price falls back to the base price', () => {
  for (const broken of [0, -100, 'not-a-number', Number.NaN]) {
    const schema = buildProductJsonLd({
      title: 'پیراهن',
      slug: 'shirt',
      variants: [{ price: 4500000, discountedPrice: broken as never, stock: 1 }],
    });

    assert.equal(
      offers(schema).price,
      4500000 * RIALS_PER_TOMAN,
      `unexpected price for discountedPrice=${String(broken)}`,
    );
  }
});

test('offers is omitted entirely when no valid price exists', () => {
  const schema = buildProductJsonLd({
    title: 'بدون قیمت',
    slug: 'no-price',
    variants: [{ price: 0, stock: 3 }],
  });

  assert.ok(schema);
  assert.equal('offers' in schema, false);
});

test('an out-of-stock product still renders with OutOfStock availability', () => {
  const schema = buildProductJsonLd({
    title: 'ناموجود',
    slug: 'out',
    variants: [{ price: 500000, stock: 0 }],
  });

  const offer = offers(schema);

  assert.equal(offer.availability, 'https://schema.org/OutOfStock');
  // هنوز قیمت دارد؛ صفحه ۲۰۰ است و قیمت نمایش داده می‌شود.
  assert.equal(offer.price, 500000 * RIALS_PER_TOMAN);
});

test('availability is InStock when at least one variant has stock', () => {
  const schema = buildProductJsonLd({
    title: 'موجود',
    slug: 'in',
    variants: [
      { price: 500000, stock: 0 },
      { price: 600000, stock: 4 },
    ],
  });

  assert.equal(offers(schema).availability, 'https://schema.org/InStock');
});

test('priceValidUntil is only emitted for a valid, future expiration date', () => {
  const base = {
    price: 1000000,
    discountedPrice: 800000,
    stock: 1,
  };

  const valid = buildProductJsonLd({
    title: 'x',
    slug: 'x',
    variants: [{ ...base, discountExpiresAt: FUTURE }],
  });
  assert.equal(offers(valid).priceValidUntil, FUTURE);

  // تاریخ گذشته یعنی تخفیف دیگر معتبر نیست
  const stale = buildProductJsonLd({
    title: 'x',
    slug: 'x',
    variants: [{ ...base, discountExpiresAt: PAST }],
  });
  assert.equal('priceValidUntil' in offers(stale), false);

  // تاریخ نامعتبر
  const invalid = buildProductJsonLd({
    title: 'x',
    slug: 'x',
    variants: [{ ...base, discountExpiresAt: 'not-a-date' }],
  });
  assert.equal('priceValidUntil' in offers(invalid), false);

  // بدون تاریخ
  const missing = buildProductJsonLd({
    title: 'x',
    slug: 'x',
    variants: [{ ...base }],
  });
  assert.equal('priceValidUntil' in offers(missing), false);
});

test('priceValidUntil is never emitted when the price is not actually discounted', () => {
  const schema = buildProductJsonLd({
    title: 'x',
    slug: 'x',
    // تخفیف با قیمت پایه برابر است → تخفیف واقعی نیست
    variants: [{ price: 1000000, discountedPrice: 1000000, stock: 1, discountExpiresAt: FUTURE }],
  });

  assert.equal('priceValidUntil' in offers(schema), false);
});

test('AggregateOffer is not used: a single Offer is published', () => {
  const schema = buildProductJsonLd({
    title: 'x',
    slug: 'x',
    variants: [{ price: 100, stock: 1 }],
  });

  assert.equal(offers(schema)['@type'], 'Offer');
  assert.equal('lowPrice' in offers(schema), false);
  assert.equal('highPrice' in offers(schema), false);
});

test('image is an absolute URL when the media base is configured', () => {
  process.env.NEXT_PUBLIC_IMAGE_URL = 'https://zoppinico.com/uploads/';

  const schema = buildProductJsonLd({
    title: 'کفش',
    slug: 'shoes',
    image: 'b0ba3e71-dce7-46be-9ae7-6b73732ac4a3.webp',
    variants: [{ price: 1000, stock: 1 }],
  });

  assert.equal(
    schema?.image,
    'https://zoppinico.com/uploads/b0ba3e71-dce7-46be-9ae7-6b73732ac4a3.webp',
  );
});

test('image stays absolute even without the media base', () => {
  process.env.NEXT_PUBLIC_IMAGE_URL = '';

  const schema = buildProductJsonLd({
    title: 'کفش',
    slug: 'shoes',
    image: 'logo/shoes.webp',
    variants: [{ price: 1000, stock: 1 }],
  });

  assert.equal(schema?.image, 'https://zoppinico.com/logo/shoes.webp');
});

test('an empty image never produces an empty image value', () => {
  const schema = buildProductJsonLd({
    title: 'بدون تصویر',
    slug: 'no-image',
    image: null,
    variants: [{ price: 1000, stock: 1 }],
  });

  assert.ok(schema);
  assert.equal('image' in schema, false);
});

test('the product URL is absolute and safely encoded for Persian slugs', () => {
  const schema = buildProductJsonLd({
    title: 'پیراهن',
    slug: '%d9%be%db%8c%d8%b1%d8%a7%d9%87%d9%86-630',
    variants: [{ price: 1000, stock: 1 }],
  });

  assert.equal(
    offers(schema).url,
    'https://zoppinico.com/product/%d9%be%db%8c%d8%b1%d8%a7%d9%87%d9%86-630',
  );
});

test('description is stripped of HTML and trimmed; brand and SKU are preserved', () => {
  const schema = buildProductJsonLd({
    title: 'پیراهن',
    slug: 'shirt',
    productCode: 'ZP0040465',
    description: '<p>توضیح <strong>مهم</strong></p>',
    variants: [{ price: 1000, stock: 1 }],
  });

  assert.equal(schema?.description, 'توضیح مهم');
  assert.equal(schema?.sku, 'ZP0040465');
  assert.deepEqual(schema?.brand, { '@type': 'Brand', name: 'زوپینی' });
});

test('schema is skipped entirely when title or slug is missing', () => {
  assert.equal(buildProductJsonLd(null), null);
  assert.equal(buildProductJsonLd({ slug: 'x' }), null);
  assert.equal(buildProductJsonLd({ title: 'x' }), null);
});

// ───────────────────────── helpers shared with the UI ─────────────────────────

test('resolveDisplayVariant falls back to the first variant like the storefront', () => {
  const variants = [
    { price: 900, color: { id: 1 }, size: { id: 10 } },
    { price: 500, color: { id: 2 }, size: { id: 20 } },
  ];

  assert.equal(resolveDisplayVariant(variants)?.price, 900);
  assert.equal(
    resolveDisplayVariant(variants, { colorId: 2, sizeId: 20 })?.price,
    500,
  );
  // انتخابِ ناقص (فقط رنگ) نباید روی یک variant نیمه‌منطبق بنشیند
  assert.equal(resolveDisplayVariant(variants, { colorId: 2 })?.price, 900);
  assert.equal(resolveDisplayVariant([]), null);
});

test('effectivePrice prefers the discounted price and rejects invalid values', () => {
  assert.equal(effectivePrice({ price: 1000, discountedPrice: 800 }), 800);
  assert.equal(effectivePrice({ price: 1000, discountedPrice: null }), 1000);
  assert.equal(effectivePrice({ price: 1000, discountedPrice: 0 }), 1000);
  assert.equal(effectivePrice({ price: 0 }), null);
  assert.equal(effectivePrice(null), null);
});

test('isDiscounted ignores zero-effect discounts', () => {
  assert.equal(isDiscounted({ price: 1000, discountedPrice: 800 }), true);
  assert.equal(isDiscounted({ price: 1000, discountedPrice: 1000 }), false);
  assert.equal(isDiscounted({ price: 1000 }), false);
});

test('discountExpiresAt only accepts valid future dates on discounted variants', () => {
  assert.equal(
    discountExpiresAt({ price: 1000, discountedPrice: 800, discountExpiresAt: FUTURE }),
    FUTURE,
  );
  assert.equal(
    discountExpiresAt({ price: 1000, discountedPrice: 800, discountExpiresAt: PAST }),
    null,
  );
  assert.equal(
    discountExpiresAt({ price: 1000, discountedPrice: 800, discountExpiresAt: 'x' }),
    null,
  );
  // بدون تخفیف واقعی، تاریخ منتشر نمی‌شود
  assert.equal(discountExpiresAt({ price: 1000, discountExpiresAt: FUTURE }), null);
});
