import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  canCancelOrder,
  canPayOrderOnline,
  countOrdersByStatus,
  getOrderCardAmount,
  getOrderStatusLabel,
  getOrderStatusMeta,
  isOrderInProgress,
  isOrderStatus,
  needsWalletConfirmation,
  nextActionForOrder,
  resolveOrderSummary,
} from '@/lib/order-status';
import { OrderStatus } from '@/services/features/orders/type';

/**
 * تست‌های نگاشت و شمارشِ وضعیت سفارش.
 *
 * سناریوی واقعیِ گزارش‌شده: مشتری ۳ سفارش دارد — ۲ تای آن‌ها «در انتظار
 * پرداخت» و یکی «لغو شده». هیچ سفارشی تحویل نشده است، بنابراین خلاصه باید
 * `delivered = 0` باشد (قبلاً عددِ لغوشده زیر برچسب «تحویل شده» می‌آمد).
 */

const reportedOrders = [
  { id: 1, status: OrderStatus.PENDING },
  { id: 2, status: OrderStatus.PENDING },
  { id: 3, status: OrderStatus.CANCELLED },
];

test('reported case: 3 orders (2 awaiting payment, 1 cancelled) ⇒ 0 delivered', () => {
  const counts = countOrdersByStatus(reportedOrders);

  assert.equal(counts.total, 3);
  assert.equal(counts.pending, 2);
  assert.equal(counts.delivered, 0);
  assert.equal(counts.cancelled, 1);
  assert.equal(counts.inProgress, 2);
});

test('server stats for the reported case resolve to the same numbers', () => {
  const summary = resolveOrderSummary({
    data: reportedOrders,
    stats: {
      total: 3,
      awaitingPayment: 2,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 1,
      unknown: 0,
      inProgress: 2,
    },
  });

  assert.equal(summary?.total, 3);
  assert.equal(summary?.awaitingPayment, 2);
  assert.equal(summary?.delivered, 0);
  assert.equal(summary?.cancelled, 1);
});

test('summary returns null while there is no response so no misleading zeros are shown', () => {
  assert.equal(resolveOrderSummary(undefined), null);
  assert.equal(resolveOrderSummary(null), null);
});

test('summary falls back to counting the loaded orders when the server sends no stats', () => {
  const summary = resolveOrderSummary({ data: reportedOrders });

  assert.equal(summary?.total, 3);
  assert.equal(summary?.awaitingPayment, 2);
  assert.equal(summary?.delivered, 0);
  assert.equal(summary?.cancelled, 1);
});

test('summary never turns a cancelled order into a delivered one', () => {
  const summary = resolveOrderSummary({
    data: reportedOrders,
    // پاسخی که فقط فیلدهای قدیمی را دارد (بدون awaitingPayment)
    stats: { total: 3, cancelled: 1, delivered: 0, inProgress: 2 },
  });

  assert.equal(summary?.delivered, 0);
  assert.equal(summary?.cancelled, 1);
  assert.equal(summary?.awaitingPayment, 0);
});

test('summary ignores non-numeric or negative counts', () => {
  const summary = resolveOrderSummary({
    data: reportedOrders,
    stats: {
      total: '3',
      awaitingPayment: 2,
      processing: -1,
      shipped: null,
      delivered: 'نامعتبر',
      cancelled: 1,
      unknown: undefined,
      inProgress: 2,
    },
  });

  assert.equal(summary?.total, 3);
  assert.equal(summary?.processing, 0);
  assert.equal(summary?.delivered, 0);
  assert.equal(summary?.cancelled, 1);
});

test('unknown or empty statuses are counted separately and never as delivered', () => {
  const counts = countOrdersByStatus([
    { status: 'delivered_to_store' },
    { status: null },
    { status: undefined },
    {},
    { status: OrderStatus.DELIVERED },
  ]);

  assert.equal(counts.unknown, 4);
  assert.equal(counts.delivered, 1);
  assert.equal(counts.cancelled, 0);
  assert.equal(counts.total, 5);
});

test('status labels are explicit and never throw for unknown values', () => {
  assert.equal(getOrderStatusLabel(OrderStatus.PENDING), 'در انتظار پرداخت');
  assert.equal(getOrderStatusLabel(OrderStatus.PAID), 'پرداخت شده');
  assert.equal(getOrderStatusLabel(OrderStatus.SHIPPED), 'ارسال شده');
  assert.equal(getOrderStatusLabel(OrderStatus.DELIVERED), 'تحویل شده');
  assert.equal(getOrderStatusLabel(OrderStatus.CANCELLED), 'لغو شده');

  for (const value of ['', 'unknown', null, undefined, 42, {}]) {
    const meta = getOrderStatusMeta(value);

    assert.equal(meta.status, 'unknown');
    assert.equal(meta.label, 'وضعیت نامشخص');
  }
});

test('isOrderStatus only accepts the real statuses', () => {
  assert.equal(isOrderStatus('pending'), true);
  assert.equal(isOrderStatus('cancelled'), true);
  assert.equal(isOrderStatus('Pending'), false);
  assert.equal(isOrderStatus(''), false);
  assert.equal(isOrderStatus(undefined), false);
});

test('in-progress covers pending, paid and shipped but never cancelled or delivered', () => {
  assert.equal(isOrderInProgress(OrderStatus.PENDING), true);
  assert.equal(isOrderInProgress(OrderStatus.PAID), true);
  assert.equal(isOrderInProgress(OrderStatus.SHIPPED), true);
  assert.equal(isOrderInProgress(OrderStatus.DELIVERED), false);
  assert.equal(isOrderInProgress(OrderStatus.CANCELLED), false);
});

/* ================== اقدام‌های مجاز ================== */

const order = (
  overrides: Partial<{
    status: unknown;
    finalPrice: number;
    walletPayment: string;
    clubCreditPayment: string;
  }> = {},
) => ({
  id: 7,
  orderNumber: 'ZP-7',
  status: OrderStatus.PENDING,
  finalPrice: 1000000,
  walletPayment: '0',
  clubCreditPayment: '0',
  ...overrides,
});

test('only pending orders can be cancelled (the server rejects anything else)', () => {
  assert.equal(canCancelOrder(order({ status: OrderStatus.PENDING })), true);

  for (const status of [
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    'unknown-status',
    null,
  ]) {
    assert.equal(canCancelOrder(order({ status })), false, String(status));
  }
});

test('payment is offered only for pending orders with a remaining card amount', () => {
  assert.equal(canPayOrderOnline(order()), true);
  assert.equal(
    canPayOrderOnline(order({ walletPayment: '400000' })),
    true,
  );

  for (const status of [
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ]) {
    assert.equal(canPayOrderOnline(order({ status })), false, status);
  }
});

test('card amount subtracts both wallet and club credit (same rule as the server)', () => {
  assert.equal(getOrderCardAmount(order()), 1_000_000);
  assert.equal(
    getOrderCardAmount(
      order({ walletPayment: '400000', clubCreditPayment: '100000' }),
    ),
    500_000,
  );
  // کل مبلغ با اعتبارها پوشش داده شده ⇒ سرور درخواست درگاه را رد می‌کند
  assert.equal(
    getOrderCardAmount(
      order({ walletPayment: '600000', clubCreditPayment: '400000' }),
    ),
    0,
  );
  assert.equal(
    canPayOrderOnline(
      order({ walletPayment: '600000', clubCreditPayment: '400000' }),
    ),
    false,
  );
});

test('amounts are clamped at zero and invalid numbers are treated as zero', () => {
  const messy = order({
    walletPayment: 'not-a-number',
    clubCreditPayment: undefined as unknown as string,
    finalPrice: 500_000,
  });

  assert.equal(getOrderCardAmount(messy), 500_000);
});

test('orders fully covered by wallet/club credit ask for confirmation, not a gateway', () => {
  const covered = order({
    walletPayment: '600000',
    clubCreditPayment: '400000',
  });

  assert.equal(needsWalletConfirmation(covered), true);
  assert.equal(nextActionForOrder(covered), 'تأیید با اعتبارها');

  const partial = order({ walletPayment: '100000' });

  assert.equal(needsWalletConfirmation(partial), false);
  assert.equal(nextActionForOrder(partial), 'پرداخت سفارش');
});

test('non-payable statuses expose no payment or cancellation action', () => {
  for (const status of [
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ]) {
    const target = order({ status });

    assert.equal(canPayOrderOnline(target), false, status);
    assert.equal(canCancelOrder(target), false, status);
    assert.equal(needsWalletConfirmation(target), false, status);
  }
});
