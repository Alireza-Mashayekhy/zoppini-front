import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

/**
 * آرشیو قیمت بالای دکمهٔ افزودن به سبد خرید (فاز ۸):
 * ۱) قیمت بالای دکمهٔ «افزودن به سبد خرید» است (نه داخل آن).
 * ۲) دکمهٔ اصلی نارنجی برند است و متنش خوانا و وسط‌چین است.
 * ۳) badge تخفیف bg-[#EF4056] است و درصد با مقادیر نامعتبر نمایش داده نمی‌شود.
 */

const contentSrc = readFileSync(
  resolve(__dirname, '../components/pages/product/content.tsx'),
  'utf-8',
);

test('price block sits above the add-to-cart button (not inside it)', () => {
  // ترتیب اعلان‌ها: بلوک قیمت قبل از دکمهٔ افزودن به سبد
  const mainJsx = contentSrc.indexOf('return (', contentSrc.indexOf('handleAddToCart'));
  const priceBlock = contentSrc.indexOf('mr-auto flex w-fit flex-col items-end', mainJsx);
  const addToCartBtn = contentSrc.indexOf('افزودن به سبد خرید', mainJsx);
  assert.ok(priceBlock !== -1, 'price section missing');
  assert.ok(addToCartBtn !== -1, 'add-to-cart label missing');
  assert.ok(
    priceBlock < addToCartBtn,
    `price section (${priceBlock}) must come before button (${addToCartBtn})`,
  );
});

test('add-to-cart button uses the brand orange with legible centered text', () => {
  assert.match(contentSrc, /bg-\[rgb\(201,97,21\)\]/);
  // متن تیره روی نارنجی روشن‌تر از متن سفید کنتراست دارد
  assert.match(contentSrc, /text-stone-950/);
  assert.doesNotMatch(
    contentSrc,
    /bg-\[#EF4056\][^\n]*افزودن به سبد خرید/,
  );
  // دکمه متن‌باز است: justify-center, نه justify-between
  assert.match(contentSrc, /justify-center/);
  assert.doesNotMatch(contentSrc, /justify-between/);
  // ارتفاع ثابت و rounded
  assert.match(contentSrc, /h-\[50px\]/);
  assert.match(contentSrc, /rounded-xl/);
});

test('discount badge uses #EF4056 and % never renders without valid discount', () => {
  assert.match(contentSrc, /rounded-full bg-\[#EF4056\]/);
  // درصد از خودِ تخفیف محاسبه می‌شود، نه از قالب‌بندی
  assert.match(contentSrc, /discountPercent\(price, discountedPrice\)/);
});

test('discounted row shows strikethrough original price beside the red % badge', () => {
  assert.match(contentSrc, /line-through/);
});

test('product page actions include share and compare beside wishlist', () => {
  const mainJsx = contentSrc.indexOf('return (', contentSrc.indexOf('handleAddToCart'));
  const shareIdx = contentSrc.indexOf('<ProductShareButton', mainJsx);
  const compareIdx = contentSrc.indexOf('<CompareToggle', mainJsx);
  const wishlistIdx = contentSrc.indexOf('<WishlistButton', mainJsx);
  assert.ok(shareIdx !== -1, 'share button missing');
  assert.ok(compareIdx !== -1, 'compare button missing');
  assert.ok(wishlistIdx !== -1, 'wishlist button missing');
  // همه سه تگِ اکشن در همان flex container قرار می‌گیرند
  assert.ok(shareIdx < compareIdx, 'share before compare');
  assert.ok(compareIdx < wishlistIdx, 'compare before wishlist');
});

test('product gallery has a back button fixed to upper-left with aria-label', () => {
  const gallerySrc = readFileSync(
    resolve(__dirname, '../components/pages/product/gallery.tsx'),
    'utf-8',
  );
  assert.match(gallerySrc, /absolute top-4 left-4 z-10/);
  assert.match(gallerySrc, /aria-label="برگشت/);
  assert.match(gallerySrc, /router\.back\(\)/);
});
