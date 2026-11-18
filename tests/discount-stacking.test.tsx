import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import SaleTable from '../components/admin/discount/sale-table';
import ProductCard from '../components/shared/product-card';
import {
  Discount,
  DiscountKind,
  DiscountType,
} from '../services/features/discounts/types';

process.env.NEXT_PUBLIC_IMAGE_URL = '';

function baseDiscount(overrides: Partial<Discount> = {}): Discount {
  return {
    id: 1,
    kind: DiscountKind.SALE,
    title: 'حراج پاییزه',
    code: null,
    type: DiscountType.PERCENTAGE,
    value: 50,
    maxDiscountAmount: null,
    minOrderAmount: null,
    maxUsesPerUser: null,
    maxTotalUses: null,
    excludeSaleItems: false,
    stackable: false,
    stackPriority: 0,
    appliesToAllProducts: false,
    isActive: true,
    startsAt: '2026-11-01T00:00:00.000Z',
    expiresAt: '2026-12-01T00:00:00.000Z',
    productsCount: 2,
    categoriesCount: 0,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

// =============================================================
// پنل مدیریت: نمایش مرحله و دامنه
// =============================================================

test('sale table shows sequential stage and "all products" scope', () => {
  const html = renderToStaticMarkup(
    createElement(SaleTable, {
      discounts: [
        baseDiscount({
          id: 1,
          title: 'مرحلهٔ اول',
          stackable: true,
          stackPriority: 0,
          appliesToAllProducts: true,
        }),
        baseDiscount({
          id: 2,
          title: 'مرحلهٔ دوم',
          value: 20,
          stackable: true,
          stackPriority: 1,
          appliesToAllProducts: false,
          productsCount: 3,
        }),
      ],
      onEdit: () => {},
      onDelete: () => {},
    }),
  );

  assert.match(html, /متوالی/);
  assert.match(html, /همهٔ محصولات/);
  // مرحلهٔ ۲ برای تخفیف با اولویت ۱ (نمایش یک‌پایه برای ادمین)
  assert.match(html, /مرحلهٔ ۲/);
  assert.match(html, /۳ محصول/);
});

test('legacy sale rows stay single-stage in the admin table', () => {
  const html = renderToStaticMarkup(
    createElement(SaleTable, {
      discounts: [baseDiscount()],
      onEdit: () => {},
      onDelete: () => {},
    }),
  );

  assert.match(html, /تک‌مرحله‌ای/);
  assert.doesNotMatch(html, /مرحلهٔ ۱/);
  assert.doesNotMatch(html, /همهٔ محصولات/);
  assert.match(html, /۲ محصول/);
});

// =============================================================
// نمایش قیمت مؤثر تخفیف متوالی در کارت محصول
// =============================================================

function cardStageMarkup(html: string, stage: number): string {
  const start = html.indexOf(`data-discount-stage="${stage}"`);
  assert.notEqual(start, -1, `stage ${stage} is missing`);
  const end = html.indexOf('</div>', start);
  assert.notEqual(end, -1, `stage ${stage} is not closed`);
  return html.slice(start, end);
}

test('product card shows the combined effective price of stacked discounts (60%, not 70%)', () => {
  const html = renderToStaticMarkup(
    createElement(ProductCard, {
      id: 1,
      image: '/product-example.webp',
      title: 'پیراهن مردانه زوپینی',
      price: 10_000_000,
      slug: 'example',
      discount: {
        id: 2,
        code: null,
        title: 'مرحلهٔ دوم',
        type: DiscountType.PERCENTAGE,
        value: 20,
        maxDiscountAmount: null,
        discountAmount: 6_000_000,
        originalPrice: 10_000_000,
        finalPrice: 4_000_000,
        effectivePercent: 60,
        stacked: true,
        stages: [
          {
            discountId: 1,
            title: 'مرحلهٔ اول',
            type: DiscountType.PERCENTAGE,
            value: 50,
            maxDiscountAmount: null,
            discountAmount: 5_000_000,
            priceBefore: 10_000_000,
            priceAfter: 5_000_000,
          },
          {
            discountId: 2,
            title: 'مرحلهٔ دوم',
            type: DiscountType.PERCENTAGE,
            value: 20,
            maxDiscountAmount: null,
            discountAmount: 1_000_000,
            priceBefore: 5_000_000,
            priceAfter: 4_000_000,
          },
        ],
      },
    }),
  );

  // ۶۰٪ (نه ۷۰٪) و قیمت نهایی ۴٬۰۰۰٬۰۰۰
  assert.match(html, /۶۰٪/);
  assert.match(html, /۴٬۰۰۰٬۰۰۰/);
  assert.doesNotMatch(html, /۷۰٪/);

  // زنجیرهٔ واقعی: قیمت اصلی با درصد مرحلهٔ اول، قیمت میانی با درصد مرحلهٔ دوم
  assert.match(html, /data-stacked-discount="true"/);

  const firstStage = cardStageMarkup(html, 1);
  assert.match(firstStage, /<del/);
  assert.match(firstStage, /۱۰٬۰۰۰٬۰۰۰/);
  assert.match(firstStage, /۵۰٪/);
  assert.doesNotMatch(firstStage, /۵٬۰۰۰٬۰۰۰|۲۰٪/);

  const secondStage = cardStageMarkup(html, 2);
  assert.match(secondStage, /<del/);
  assert.match(secondStage, /۵٬۰۰۰٬۰۰۰/);
  assert.match(secondStage, /۲۰٪/);
  assert.doesNotMatch(secondStage, /۱۰٬۰۰۰٬۰۰۰|۵۰٪/);

  // قیمت نهایی بعد از هر دو مرحله و بدون خط‌خوردگی
  const finalPriceStart = html.lastIndexOf('data-discount-stage="2"');
  const finalPriceBlock = html.slice(
    html.indexOf('</div>', finalPriceStart) + 6,
  );
  assert.match(finalPriceBlock, /۴٬۰۰۰٬۰۰۰/);
  assert.doesNotMatch(finalPriceBlock, /<del/);
});

test('stacked card derives each badge from the amount that stage actually removed', () => {
  const html = renderToStaticMarkup(
    createElement(ProductCard, {
      id: 2,
      image: '/product-example.webp',
      title: 'کت مردانه زوپینی',
      price: 10_000_000,
      slug: 'example-2',
      discount: {
        id: 12,
        code: null,
        title: 'مرحلهٔ دوم',
        type: DiscountType.FIXED,
        value: 1_000_000,
        maxDiscountAmount: null,
        discountAmount: 2_000_000,
        originalPrice: 10_000_000,
        finalPrice: 8_000_000,
        effectivePercent: 20,
        stacked: true,
        stages: [
          {
            discountId: 11,
            title: 'تخفیف مبلغی اول',
            type: DiscountType.FIXED,
            value: 1_000_000,
            maxDiscountAmount: null,
            discountAmount: 1_000_000,
            priceBefore: 10_000_000,
            priceAfter: 9_000_000,
          },
          {
            discountId: 12,
            title: 'تخفیف مبلغی دوم',
            type: DiscountType.FIXED,
            value: 1_000_000,
            maxDiscountAmount: null,
            discountAmount: 1_000_000,
            priceBefore: 9_000_000,
            priceAfter: 8_000_000,
          },
        ],
      },
    }),
  );

  const firstStage = cardStageMarkup(html, 1);
  const secondStage = cardStageMarkup(html, 2);

  // «value» تخفیف مبلغی درصد نیست؛ درصد هر مرحله از مبلغ واقعیِ همان مرحله می‌آید.
  assert.match(firstStage, /۱۰٬۰۰۰٬۰۰۰/);
  assert.match(firstStage, /۱۰٪/);
  assert.match(secondStage, /۹٬۰۰۰٬۰۰۰/);
  assert.match(secondStage, /۱۱٪/);
  assert.match(html, /۸٬۰۰۰٬۰۰۰/);
});
