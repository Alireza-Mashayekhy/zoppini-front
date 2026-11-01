import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveHomeImages } from './home-images';

process.env.NEXT_PUBLIC_IMAGE_URL = 'https://cdn.test/';

test('falls back to the built-in defaults when nothing is uploaded', () => {
  const images = resolveHomeImages([]);

  assert.equal(images['home.sale-banner'].isCustom, false);
  assert.equal(images['home.sale-banner'].desktop, '/home/sale_3.webp');
  assert.equal(images['home.sale-banner'].mobile, '/home/mobile_sale_3.webp');
  assert.equal(images['home.sale-banner'].linkUrl, '/products');
  assert.equal(images['home.sale-banner'].alt, 'محصولات تخفیف‌دار زوپینی');

  // ورودی نامعتبر (سرور پایین بوده) هم نباید چیزی را خراب کند
  assert.equal(resolveHomeImages(null)['home.category-2'].isCustom, false);
});

test('uses the uploaded desktop image and keeps the mobile fallback empty', () => {
  const images = resolveHomeImages([
    {
      slot: 'home.sale-banner',
      desktop: 'abc.webp',
      mobile: null,
      alt: 'بنر جدید',
      linkUrl: '/discounted-products',
    },
  ]);

  const banner = images['home.sale-banner'];

  assert.equal(banner.isCustom, true);
  assert.equal(banner.desktop, 'https://cdn.test/abc.webp');
  // خالی بودن تصویر موبایل یعنی «همان تصویر دسکتاپ» استفاده شود
  assert.equal(banner.mobile, null);
  assert.equal(banner.alt, 'بنر جدید');
  assert.equal(banner.linkUrl, '/discounted-products');
});

test('uses the uploaded mobile image when the admin provides one', () => {
  const images = resolveHomeImages([
    {
      slot: 'home.sale-banner',
      desktop: 'desktop.webp',
      mobile: 'mobile.webp',
      alt: null,
      linkUrl: null,
    },
  ]);

  assert.equal(
    images['home.sale-banner'].desktop,
    'https://cdn.test/desktop.webp',
  );
  assert.equal(
    images['home.sale-banner'].mobile,
    'https://cdn.test/mobile.webp',
  );
});

test('falls back to the default alt and link when the admin leaves them empty', () => {
  const images = resolveHomeImages([
    {
      slot: 'home.sale-banner',
      desktop: 'desktop.webp',
      mobile: null,
      alt: '   ',
      linkUrl: '',
    },
  ]);

  assert.equal(images['home.sale-banner'].alt, 'محصولات تخفیف‌دار زوپینی');
  assert.equal(images['home.sale-banner'].linkUrl, '/products');
});

test('a record without a desktop image does not replace the default', () => {
  const images = resolveHomeImages([
    {
      slot: 'home.sale-banner',
      desktop: null,
      mobile: 'mobile.webp',
      alt: 'x',
      linkUrl: null,
    },
  ]);

  assert.equal(images['home.sale-banner'].isCustom, false);
  assert.equal(images['home.sale-banner'].desktop, '/home/sale_3.webp');
});

test('ignores unknown slots', () => {
  const images = resolveHomeImages([
    {
      slot: 'home.not-a-real-slot',
      desktop: 'x.webp',
      mobile: null,
      alt: null,
      linkUrl: null,
    },
  ]);

  assert.equal(
    Object.keys(images).includes('home.not-a-real-slot' as never),
    false,
  );
});
