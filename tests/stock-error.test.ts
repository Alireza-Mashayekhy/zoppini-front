import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import {
  apiErrorMessage,
  readStockError,
  STOCK_ERROR_CODES,
  stockItemAvailability,
  stockItemName,
} from '../lib/stock-error';

const source = (path: string) =>
  readFileSync(resolve(__dirname, '..', path), 'utf8');

const axiosError = (status: number, data: unknown) => ({
  message: `Request failed with status code ${status}`,
  response: { status, data },
});

test('reads a 409 shortage with every short item', () => {
  const info = readStockError(
    axiosError(409, {
      statusCode: 409,
      code: STOCK_ERROR_CODES.INSUFFICIENT,
      message: 'موجودی برخی کالاهای سبد خرید کافی نیست.',
      items: [
        {
          variantId: 1,
          productId: 10,
          productTitle: 'شلوار',
          variantLabel: 'مشکی / 32',
          requested: 2,
          available: 1,
        },
        {
          variantId: 2,
          productId: 20,
          productTitle: 'کت',
          variantLabel: null,
          requested: 1,
          available: 0,
        },
        { productTitle: 'بدون شناسه' },
      ],
    }),
  );

  assert.ok(info);
  assert.equal(info.code, STOCK_ERROR_CODES.INSUFFICIENT);
  assert.equal(info.items.length, 2);
  assert.equal(stockItemName(info.items[0]), 'شلوار – مشکی / 32');
  assert.equal(stockItemName(info.items[1]), 'کت');
  assert.equal(
    stockItemAvailability(info.items[0]),
    'موجود: ۱ عدد (درخواستی: ۲)',
  );
  assert.equal(stockItemAvailability(info.items[1]), 'ناموجود');
});

test('reads a 503 "stock check unavailable" without items', () => {
  const info = readStockError(
    axiosError(503, {
      code: STOCK_ERROR_CODES.UNAVAILABLE,
      message: 'در حال حاضر امکان بررسی موجودی از انبار وجود ندارد.',
    }),
  );

  assert.ok(info);
  assert.equal(info.code, STOCK_ERROR_CODES.UNAVAILABLE);
  assert.deepEqual(info.items, []);
  assert.equal(
    info.message,
    'در حال حاضر امکان بررسی موجودی از انبار وجود ندارد.',
  );
});

test('other errors are not stock errors, and the generic axios text is never shown', () => {
  assert.equal(
    readStockError(axiosError(400, { message: 'کد تخفیف نامعتبر است' })),
    null,
  );
  assert.equal(readStockError(new Error('Network Error')), null);
  assert.equal(readStockError(undefined), null);

  assert.equal(
    apiErrorMessage(axiosError(400, { message: ['خطای اعتبارسنجی'] }), 'x'),
    'خطای اعتبارسنجی',
  );
  assert.equal(
    apiErrorMessage(axiosError(500, '<html>'), 'خطا در ثبت سفارش'),
    'خطا در ثبت سفارش',
  );
});

test('checkout shows the shortage list and keeps the discount on stock errors', () => {
  const form = source('components/pages/checkout/checkout-form.tsx');

  assert.match(form, /const stock = readStockError\(error\);\s*if \(stock\) \{/);
  assert.match(form, /<StockShortageAlert\s+error=\{stockError\}/);
  // the stock branch returns before the discount is cleared
  const stockBranch = form.indexOf('const stock = readStockError(error);\n      if (stock)');
  const clearDiscount = form.indexOf('setAppliedDiscount(null);\n    }\n  };');
  assert.ok(stockBranch > 0 && clearDiscount > stockBranch);
});

test('order and payment errors are toasted once', () => {
  const orders = source('services/features/orders/hooks.ts');
  const createOrderHook = orders.slice(orders.indexOf('export const useCreateOrder'));
  assert.doesNotMatch(
    createOrderHook.slice(0, createOrderHook.indexOf('};')),
    /toast\.error/,
  );

  const paymentSection = source(
    'components/pages/checkout/payment-section-content.tsx',
  );
  assert.doesNotMatch(paymentSection, /onError:/);
});
