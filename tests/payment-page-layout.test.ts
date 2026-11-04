import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

test('payment page reserves space for the fixed header including its loading state', () => {
  const page = readFileSync(join(process.cwd(), 'app/(public)/checkout/payment/page.tsx'), 'utf8');
  assert.match(page, /<main className="pt-\[52px\]">\s*<Suspense/);
  assert.match(page, /fallback=.*در حال بارگذاری/);
  assert.match(page, /<PaymentSelectionContent\s*\/>/);
});
