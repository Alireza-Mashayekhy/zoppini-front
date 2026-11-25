import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const form = readFileSync(
  resolve(__dirname, '../components/pages/checkout/checkout-form.tsx'),
  'utf8',
);

// Both responsive layouts stay mounted. Registering the same text input twice
// lets the hidden input's ref overwrite the value entered in the visible one.
test('mobile and desktop discount inputs use one controlled form value', () => {
  assert.match(
    form,
    /const discountCode = useWatch\(\{\s*control: methods\.control,\s*name: 'discountCode',\s*\}\)/,
  );
  const input = form.match(
    /<Input\b[^>]*name="discountCode"[\s\S]*?placeholder="کد تخفیف را وارد کنید"/,
  )?.[0];
  assert.ok(input);
  assert.match(input, /value=\{discountCode \?\? ''\}/);
  assert.match(
    input,
    /onChange=\{event =>\s*setValue\('discountCode', event\.target\.value,\s*\{\s*shouldDirty: true,/,
  );
  assert.doesNotMatch(form, /register\(['"]discountCode['"]\)/);
  assert.equal((form.match(/\{paymentContent\}/g) ?? []).length, 2);
});

test('apply reads the shared value and preserves normalization and empty-code validation', () => {
  const apply = form.slice(
    form.indexOf('const handleApplyDiscount ='),
    form.indexOf('const handleRemoveDiscount ='),
  );
  assert.match(apply, /getValues\('discountCode'\)\?\.trim\(\)\.toUpperCase\(\)/);
  assert.match(apply, /if \(!code\)\s*\{\s*toast\.error\('لطفاً کد تخفیف را وارد کنید'\)/);
  assert.match(apply, /applyDiscountMutation\.mutateAsync\(\{\s*code,\s*\}\)/);
});

test('removing a discount clears the shared value for both layouts', () => {
  const remove = form.slice(
    form.indexOf('const handleRemoveDiscount ='),
    form.indexOf('const handleRemoveDiscount =') + 250,
  );
  assert.match(remove, /setAppliedDiscount\(null\)/);
  assert.match(remove, /setValue\('discountCode', ''\)/);
});
