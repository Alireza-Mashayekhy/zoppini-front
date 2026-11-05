import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import {
  canPayOrderOnline,
  getOrderCardAmount,
} from '../components/dashboard/order-payment';
import { OrderResponse, OrderStatus } from '../services/features/orders/type';

const source = (path: string) =>
  readFileSync(resolve(__dirname, '..', path), 'utf8');

const order = (overrides: Partial<OrderResponse>) =>
  ({
    id: 7,
    orderNumber: 'ORD-7',
    totalPrice: 1000000,
    shippingCost: 0,
    discount: 0,
    finalPrice: 1000000,
    walletPayment: '0',
    status: OrderStatus.PENDING,
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
    items: [],
    ...overrides,
  }) as OrderResponse;

test('سفارش در انتظار پرداخت بدون کیف پول با کل مبلغ پرداخت می‌شود', () => {
  const pending = order({});

  assert.equal(getOrderCardAmount(pending), 1000000);
  assert.equal(canPayOrderOnline(pending), true);
});

test('مبلغ کیف پول از مبلغ درگاه کسر می‌شود', () => {
  const partial = order({ walletPayment: '400000' });

  assert.equal(getOrderCardAmount(partial), 600000);
  assert.equal(canPayOrderOnline(partial), true);
});

test('سفارشی که کامل با کیف پول پوشش داده شده، دکمه درگاه ندارد', () => {
  const covered = order({ walletPayment: '1000000' });

  assert.equal(getOrderCardAmount(covered), 0);
  assert.equal(canPayOrderOnline(covered), false);
});

test('سفارش غیر از «در انتظار پرداخت» قابل پرداخت نیست', () => {
  for (const status of [
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ]) {
    assert.equal(canPayOrderOnline(order({ status })), false, status);
  }
});

test('داشبورد دکمه پرداخت را فقط برای سفارش قابل پرداخت نشان می‌دهد و لغو باقی است', () => {
  const item = source('components/dashboard/order-item.tsx');

  assert.match(item, /canPayOrderOnline\(order\)/);
  assert.match(item, /<OrderPayment order=\{order\} \/>/);
  assert.match(item, /لغو سفارش/);
  assert.match(item, /cancelOrder\.mutate\(order\.id\)/);
});

test('پنل پرداخت درگاه را انتخاب و با همان سفارش پرداخت را شروع می‌کند', () => {
  const panel = source('components/dashboard/order-payment.tsx');

  assert.match(panel, /useStartPayment\(\)/);
  assert.match(
    panel,
    /startPayment\.mutate\(\s*\{ orderId: order\.id, gateway: selectedGateway \}/,
  );
  assert.match(panel, /window\.location\.href = payUrl/);
  assert.match(panel, /PaymentGateway\.ZARINPAL/);
  assert.match(panel, /PaymentGateway\.DIGIPAY/);
  assert.match(panel, /PaymentGateway\.TARA/);
  assert.doesNotMatch(panel, /PaymentGateway\.MELLAT/);
  // اسنپ‌پی فقط وقتی پنل باز است و با شناسه سفارش استعلام می‌شود
  assert.match(
    panel,
    /useSnappayEligibility\(\s*\{ orderId: order\.id \},\s*open,?\s*\)/,
  );
  assert.match(panel, /لطفاً یک درگاه پرداخت انتخاب کنید/);
});
