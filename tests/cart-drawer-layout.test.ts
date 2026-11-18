import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const src = readFileSync(
  resolve(__dirname, '../components/layout/public/cart.tsx'),
  'utf8',
);

test('کشوی سبد در موبایل تمام عرض و در دسکتاپ عرض مشخص دارد', () => {
  assert.match(src, /w-screen/);
  assert.match(src, /data-\[side=left\]:w-full!/);
  assert.match(src, /data-\[side=left\]:max-w-none!/);
  assert.match(src, /sm:data-\[side=left\]:w-\[26rem\]!/);
  assert.match(src, /h-\[100dvh\]/);
});

test('لیست اقلام اسکرول می‌شود و خلاصه/دکمهٔ تسویه بیرون آن می‌ماند', () => {
  assert.match(src, /min-h-0 flex-1[^\n]*overflow-y-auto/);
  assert.match(src, /shrink-0 space-y-3 border-t/);
  assert.match(src, /env\(safe-area-inset-bottom\)/);
});

test('هر ردیف یک گرید RTL باثبات با ستون ثابت برای حذف است', () => {
  assert.match(
    src,
    /grid-cols-\[4\.5rem_minmax\(0,1fr\)_2\.75rem\]/,
  );
  // تصویر، متن و دکمهٔ حذف در سه ستون؛ حذف در ستون چپ فیزیکی
  assert.match(src, /dir="rtl"/);
  assert.match(src, /aria-label="حذف از سبد خرید"/);
  assert.match(src, /break-words/);
});

test('کنترل تعداد گروه‌بندی شده و قیمت در خط بعدی زیر آن است', () => {
  const quantityIndex = src.indexOf('aria-label="کاهش تعداد"');
  const priceIndex = src.indexOf('<CartLinePrice item={item} />');
  assert.ok(quantityIndex > 0 && priceIndex > quantityIndex);
  // قیمت و واحد پول در یک span nowrap (و bdi برای اعداد) می‌مانند
  assert.match(src, /whitespace-nowrap/);
  assert.match(src, /<bdi>/);
});

test('دکمه‌های آیکن‌دار نام دسترس‌پذیر دارند', () => {
  assert.match(src, /aria-label="افزایش تعداد"/);
  assert.match(src, /aria-label="کاهش تعداد"/);
  assert.match(src, /aria-label="حذف از سبد خرید"/);
});
