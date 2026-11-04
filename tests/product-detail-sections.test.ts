import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import InstallmentInfo from '../components/pages/product/installment-info';
import TrustStrip from '../components/pages/product/trust-strip';
import ProductCard from '../components/shared/product-card';
import { DiscountType } from '../services/features/discounts/types';

process.env.NEXT_PUBLIC_IMAGE_URL = '';

// متنهای فارسی سایت گاهی با نیمفاصله نوشته میشوند؛ مقایسهها را بیاثر از آن میکنیم.
const normalize = (value: string) => value.replace(/\u200c/g, '');

const props = {
  id: 1,
  image: '/product-example.webp',
  title: 'پیراهن مردانه زوپینی',
  price: 1000000,
  slug: 'example',
};

const discount = {
  id: 1,
  code: null,
  discountAmount: 200000,
  finalPrice: 800000,
  originalPrice: 1000000,
  maxDiscountAmount: null,
  type: DiscountType.PERCENTAGE,
  value: 20,
};

const BRAND_PINK_PURPLE =
  /#f0e6f9|#faf6fe|#6b21a8|#fce7f3|#ec4899|#ff007f|pink|fuchsia|purple/i;

test('نوار اقساط اسنپپی دیگر در هیچ کارت محصولی (ساده، تخفیفدار، اسلایدر) نیست', () => {
  const variants = [
    props,
    { ...props, discount },
    { ...props, slider: true },
    { ...props, price: 0 },
  ];

  for (const variant of variants) {
    const html = normalize(
      renderToStaticMarkup(createElement(ProductCard, variant)),
    );

    assert.doesNotMatch(html, /خرید اقساطی|اسنپپی|قسط|دیجیپی/);
    assert.doesNotMatch(html, BRAND_PINK_PURPLE);
    assert.doesNotMatch(html, /mt-auto/);
  }

  // قیمت و لینک محصول دستنخورده باقی مانده است.
  const html = normalize(
    renderToStaticMarkup(createElement(ProductCard, props)),
  );
  assert.match(html, /href="\/product\/example"/);
  assert.match(html, /۱٬۰۰۰٬۰۰۰/);

  const cardSource = readFileSync(
    resolve(__dirname, '../components/shared/product-card.tsx'),
    'utf8',
  );
  assert.doesNotMatch(cardSource, /InstallmentBadge|installment-badge/);
});

test('بنر اقساط مبلغ هر قسط و راهنمای قابل باز کردن دارد', () => {
  const html = normalize(
    renderToStaticMarkup(createElement(InstallmentInfo, { price: 800000 })),
  );
  assert.match(html, /خرید اقساطی در ۴ قسط/);
  assert.match(html, /هر قسط/);
  assert.doesNotMatch(html, /تقریب/);
  assert.match(html, /۲۰۰٬۰۰۰/);
  assert.match(html, /تومان/);
  assert.match(html, /<button/);
  assert.match(html, /aria-haspopup="dialog"/);
});

test('نوار اعتماد همان چهار آیتم مرجع را با متن و پالت زوپینی دارد', () => {
  const html = normalize(renderToStaticMarkup(createElement(TrustStrip, {})));

  assert.match(html, /با خیال راحت خرید کنید/);
  assert.match(html, /زوپینی بپوش، اصالت و کیفیت را تضمین میکند\./);

  for (const label of [
    'ارسال سریع',
    'ضمانت اصالت کالا',
    'درگاه پرداخت امن',
    'نماد اعتماد الکترونیک',
  ]) {
    assert.ok(html.includes(label), `آیتم «${label}» موجود است`);
  }
  // الگوی <li> (نه <line> داخل آیکنهای lucide)
  assert.equal(
    (html.match(/<li(?=[\s>])/g) ?? []).length,
    4,
    'دقیقاً چهار آیتم',
  );

  // بدون لینک/عکس خارجی و بدون رنگهای صورتی طرح مرجع.
  assert.doesNotMatch(html, /<a\b|<img|enamad|snapppay|digipay/i);
  assert.doesNotMatch(html, BRAND_PINK_PURPLE);
  assert.match(html, /border-\[#e8e6e3\]/);
});

test('محل قرارگیری: بنر زیر دکمه افزودن به سبد، نوار اعتماد بالای محصولات مرتبط', () => {
  const source = readFileSync(
    resolve(__dirname, '../components/pages/product/content.tsx'),
    'utf8',
  );

  const buttonIndex = source.indexOf('onClick={handleAddToCart}');
  const installmentIndex = source.indexOf('<InstallmentInfo');
  const descriptionIndex = source.indexOf(
    'product?.description',
    installmentIndex,
  );
  const trustIndex = source.indexOf('<TrustStrip');
  const relatedIndex = source.indexOf('<RelatedSlider');

  assert.ok(buttonIndex > -1, 'دکمه افزودن به سبد خرید موجود است');
  assert.ok(
    installmentIndex > buttonIndex,
    'بنر اقساط بعد از دکمه افزودن به سبد خرید است',
  );
  assert.match(
    source,
    /installmentPrice !== null/,
    'بنر فقط برای مدل انتخابی قیمتمند نمایش داده میشود',
  );
  assert.ok(
    descriptionIndex > installmentIndex,
    'بنر قبل از توضیحات و در همان ستون گالری است',
  );
  assert.ok(
    trustIndex > descriptionIndex,
    'نوار اعتماد بعد از سکشن گالری و توضیحات است',
  );
  assert.ok(
    relatedIndex > trustIndex,
    'نوار اعتماد بالای محصولات پیشنهادی و مرتبط است',
  );
});
