import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import ProductFilter from '../components/pages/products/product-filter';

const render = (inline = false) =>
  renderToStaticMarkup(
    createElement(ProductFilter, {
      selectedColorIds: [2],
      selectedSizeIds: [4],
      selectedPriceMin: 1000000,
      selectedPriceMax: 4000000,
      minPrice: 500000,
      maxPrice: 5000000,
      onApplyFilters: () => {},
      onClearFilters: () => {},
      colors: [
        { id: 1, name: 'مشکی', hexCode: '#000000' },
        { id: 2, name: 'سرمه‌ای', hexCode: '#123456' },
      ],
      sizes: [
        { id: 4, name: 'L' },
        { id: 3, name: '40' },
        { id: 5, name: 'M' },
      ],
      open: true,
      onOpenChange: () => {},
      inline,
    }),
  );

test('فیلتر رنگ/سایز/قیمت با دادهٔ واقعی و وضعیت انتخاب رندر می‌شود', () => {
  const html = render(false);

  assert.match(html, /aria-label="فیلتر محصولات"/);
  assert.match(html, /رنگ‌ها \(۱\)/);
  assert.match(html, /سایزها \(۱\)/);
  assert.match(html, /سرمه‌ای/);
  assert.match(html, /۱٬۰۰۰٬۰۰۰ تا ۴٬۰۰۰٬۰۰۰ تومان/);
  // آکاردئون‌ها به‌صورت پیش‌فرض بسته‌اند؛ محتوایشان در SSR رندر نمی‌شود.

  // پاک کردن فیلترها در انتهای پنل است
  assert.ok(
    html.indexOf('پاک کردن فیلترها') > html.indexOf('اعمال فیلترها'),
    'clear must be the last action',
  );
});

test('نسخهٔ موبایل همان اکشن‌ها را در انتهای لیست دارد', () => {
  const html = render(true);
  assert.match(html, /اعمال فیلترها/);
  assert.match(html, /پاک کردن فیلترها/);
  assert.match(html, /sticky bottom-0/);
});
