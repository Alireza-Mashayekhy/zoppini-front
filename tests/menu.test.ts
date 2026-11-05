import assert from 'node:assert/strict';
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
