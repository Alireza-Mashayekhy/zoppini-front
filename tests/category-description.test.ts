import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const source = (path: string) =>
  readFileSync(resolve(__dirname, '..', path), 'utf8');

test('the description block sanitizes, labels and hides empty content', () => {
  const component = source('components/shared/category-description.tsx');

  // HTML پنل هرگز خام در صفحه قرار نمی‌گیرد.
  assert.match(component, /categoryDescriptionHtml\(html\)/);
  assert.match(component, /if \(!content\) return null;/);
  assert.match(component, /dangerouslySetInnerHTML=\{\{ __html: content \}\}/);
  assert.match(component, /aria-label=\{`توضیحات \$\{name\}`\}/);
});

test('the products listing shows the panel description below the list', () => {
  const page = source('app/(public)/product-category/[categorySlug]/page.tsx');

  assert.match(page, /import CategoryDescription/);
  assert.match(
    page,
    /<CategoryDescription\s+name=\{category\.data\.name\}\s+html=\{category\.data\.description\}/,
  );
  assert.ok(
    page.indexOf('<ProductList') < page.indexOf('<CategoryDescription'),
    'توضیحات باید بعد از لیست محصولات رندر شود',
  );
});

test('the category landing reuses the exact same description block', () => {
  const page = source('app/(public)/category/[categorySlug]/page.tsx');
  const landing = source('components/pages/category/category-landing.tsx');

  assert.match(page, /description=\{category\.description\}/);
  assert.match(
    page,
    /<CategoryLanding[\s\S]*description=\{category\.description\}/,
  );
  // فقط یک نقطه‌ی رندر توضیحات در صفحه‌ی لندینگ باقی مانده باشد.
  assert.equal(landing.match(/<CategoryDescription/g)?.length, 1);
  assert.match(
    landing,
    /<CategoryDescription name=\{category\.name\} html=\{description\} \/>/,
  );
  assert.ok(
    landing.lastIndexOf('<ProductSection') <
      landing.indexOf('<CategoryDescription'),
    'توضیحات باید پایین‌تر از همه‌ی بخش‌های محصول باشد',
  );
});
