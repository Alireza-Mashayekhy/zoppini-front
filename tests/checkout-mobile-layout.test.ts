import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const src = readFileSync(
  resolve(__dirname, '../components/pages/checkout/checkout-wizard.tsx'),
  'utf8',
);

test('«مرحله بعد» در سمت چپ فیزیکی و «مرحله قبل» در سمت راست است', () => {
  // در RTL، flex-row-reverse جای فیزیکی دکمهٔ «بعد» را به چپ می‌برد.
  assert.match(src, /flex flex-row-reverse items-center gap-2/);
  assert.match(src, /onClick=\{goNext\}/);
  assert.match(src, /onClick=\{goPrev\}/);
});

test('در گام اول «مرحله قبل» غیرفعال و در گام آخر «مرحله بعد» وجود ندارد', () => {
  assert.match(src, /disabled=\{isFirst\}/);
  assert.match(src, /\{isLast \?/);
  const lastBranch = src.slice(src.indexOf('{isLast ?'), src.indexOf(') : (', src.indexOf('{isLast ?')));
  assert.doesNotMatch(lastBranch, /مرحله بعد/);
});

test('دکمهٔ نهایی عرض را سرریز نمی‌کند و برچسبش می‌تواند بشکند', () => {
  assert.match(src, /min-w-0 flex-1 shrink basis-0/);
  assert.match(src, /whitespace-normal/);
  assert.match(src, /text-\[13px\]/);
  assert.match(src, /px-3/);
});
