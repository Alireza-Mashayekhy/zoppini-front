import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import Menu from '../components/layout/public/menu';

test('the initial products menu has no promotional images', () => {
  const html = renderToStaticMarkup(createElement(Menu, { categories: [] }));
  assert.match(html, /یک دسته‌بندی را انتخاب کنید/);
  assert.doesNotMatch(html, /category_1\.webp|category_2\.webp/);
  assert.doesNotMatch(html, /w-\[210px\] shrink-0 flex-col gap-3 border-r/);
});

const source = (path: string) =>
  readFileSync(resolve(__dirname, '..', path), 'utf8');

test('mobile subcategory links carry no underline of their own', () => {
  const menu = source('components/layout/public/menu.tsx');

  // محتوای زیرمنوی موبایل داخل AccordionContent قرار می‌گیرد و آن کامپوننت
  // به همه‌ی لینک‌هایش `[&_a]:underline` می‌دهد؛ پس هر لینک داخل این بخش
  // باید خودش با `no-underline!` زیرخط را خنثی کند.
  const start = menu.indexOf('<AccordionContent>');
  const end = menu.indexOf('</AccordionContent>');
  assert.ok(start !== -1 && end > start, 'بخش زیرمنوی موبایل پیدا نشد');

  const block = menu.slice(start, end);
  const links = block.match(/<Link[\s\S]*?<\/Link>/g) ?? [];

  // «مشاهده همه» و «دسته‌بندی X» — هر دو باید بررسی شوند.
  assert.equal(links.length, 2, 'تعداد لینک‌های زیرمنو تغییر کرده است');

  for (const link of links) {
    assert.match(link, /no-underline!/, 'لینک زیرمنو نباید زیرخط داشته باشد');
  }

  assert.match(block, /مشاهده همه/);
  assert.match(block, /دسته‌بندی \{category\.name\}/);
});
