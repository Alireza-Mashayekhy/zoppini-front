import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

/**
 * قراردادهای رفتاریِ داشبورد مشتری.
 *
 * این تست‌ها روی فایل‌ها (source-level) اجرا می‌شوند چون رندرِ کامپوننت‌های
 * کلاینتی به DOM نیاز دارد؛ منطقِ خالصِ شمارش و اقدام‌ها در
 * `tests/order-status.test.ts` تست شده است. هدف اینجا جلوگیری از بازگشتِ
 * دو خطای اصلی است:
 *  ۱. نمایشِ تعدادِ لغوشده زیر برچسب «تحویل شده»؛
 *  ۲. نمایشِ درگاه‌های حذف‌شده در شارژ کیف پول.
 */

const source = (path: string) =>
  readFileSync(resolve(__dirname, '..', path), 'utf8');

test('کارت‌های خلاصه هر شمارش را زیر برچسب درست نشان می‌دهند', () => {
  const page = source('app/(user)/dashboard/page.tsx');

  // برچسبِ «تحویل شده» باید به شمارشِ delivered وصل باشد، نه cancelled
  assert.match(page, /key: 'delivered',\s*\n\s*label: 'تحویل شده',/);
  assert.match(page, /key: 'cancelled',\s*\n\s*label: 'لغو شده',/);
  assert.match(page, /key: 'awaitingPayment',\s*\n\s*label: 'در انتظار پرداخت',/);

  // مقدار از همان کلیدِ کارت خوانده می‌شود (نه از یک مقدار ثابت/جابه‌جا)
  assert.match(page, /const value = summary\[card\.key\] \?\? 0;/);

  // برچسب قدیمی حذف شده است
  assert.doesNotMatch(page, /خلاصه‌ای از فعالیت‌های شما در پنل/);
});

test('خلاصه از resolveOrderSummary می‌آید و عددسازیِ دستی ندارد', () => {
  const page = source('app/(user)/dashboard/page.tsx');

  assert.match(page, /resolveOrderSummary\(/);
  assert.doesNotMatch(page, /orders\?\.stats\?\.delivered \?\? 0/);
  assert.doesNotMatch(page, /orders\?\.stats\?\.cancelled \?\? 0/);
  assert.doesNotMatch(page, /orders\?\.stats\?\.inProgress \?\? 0/);
});

test('داشبورد حالت‌های بارگذاری، خطا و خالی دارد', () => {
  const page = source('app/(user)/dashboard/page.tsx');
  const recent = source('components/dashboard/recent-orders.tsx');

  // بارگذاری: اسکلتون (و نه عدد صفر)
  assert.match(page, /isLoading \|\| !summary/);
  assert.match(page, /aria-busy="true"/);
  // خطا: پیام + تلاش مجدد
  assert.match(page, /خلاصه سفارش‌ها دریافت نشد/);
  assert.match(page, /تلاش مجدد/);
  assert.match(recent, /سفارش‌های شما دریافت نشد/);
  // خالی: پیامِ راهنما
  assert.match(recent, /هنوز سفارشی ثبت نکرده‌اید/);
});

test('هر سفارشِ اخیر قابل باز شدن است و اقدامِ بعدی را نشان می‌دهد', () => {
  const recent = source('components/dashboard/recent-orders.tsx');

  // لینک به صفحه سفارش‌ها با شناسه سفارش (باز شدن همان سفارش)
  assert.match(recent, /href=\{`\/dashboard\/orders\?order=\$\{order\.id\}`\}/);
  assert.match(recent, /جزئیات سفارش/);

  // اقدام‌ها فقط در وضعیت مجاز
  assert.match(recent, /const payable = canPayOrderOnline\(order\);/);
  assert.match(recent, /const cancellable = canCancelOrder\(order\);/);
  assert.match(recent, /\{payable && <OrderPayment order=\{order\} \/>\}/);
  assert.match(recent, /\{cancellable && \(/);
  assert.match(recent, /پرداخت سفارش/);
  assert.match(recent, /لغو سفارش/);
});

test('لینکِ «جزئیات سفارش» همان سفارش را در صفحه سفارش‌ها باز می‌کند', () => {
  const ordersPage = source('app/(user)/dashboard/orders/page.tsx');

  assert.match(ordersPage, /params\.get\('order'\)/);
  assert.match(ordersPage, /data-order-id=/);
  assert.match(ordersPage, /scrollIntoView/);

  // هدرِ هر سفارش یک دکمه‌ی واقعی با aria-expanded است (قابل استفاده با کیبورد)
  const item = source('components/dashboard/order-item.tsx');

  assert.match(item, /aria-expanded=\{expanded\}/);
  assert.match(item, /aria-controls=\{panelId\}/);
  assert.match(item, /<button\s+type="button"/);
});

test('شارژ کیف پول فقط زرین‌پال را نشان می‌دهد', () => {
  const charge = source('components/dashboard/wallet/wallet-charge-form.tsx');

  assert.match(charge, /PaymentGateway\.ZARINPAL/);
  assert.doesNotMatch(charge, /PaymentGateway\.DIGIPAY/);
  assert.doesNotMatch(charge, /PaymentGateway\.TARA/);
  assert.doesNotMatch(charge, /PaymentGateway\.MELLAT/);

  // مبالغ سریع، ورودی مبلغ و رفتار پرداخت دست‌نخورده مانده‌اند
  assert.match(charge, /QUICK_AMOUNTS/);
  assert.match(charge, /MIN_CHARGE_AMOUNT = 1000/);
  assert.match(charge, /useStartWalletCharge/);
  assert.match(charge, /window\.location\.href = payment\.payUrl/);
});

test('درگاه‌های پرداختِ سفارش (جریانِ دیگر) دست‌نخورده مانده است', () => {
  const orderPayment = source('components/dashboard/order-payment.tsx');

  assert.match(orderPayment, /PaymentGateway\.ZARINPAL/);
  assert.match(orderPayment, /PaymentGateway\.DIGIPAY/);
  assert.match(orderPayment, /PaymentGateway\.TARA/);
});

test('سایدبار حالت انتخاب‌شده، فوکوسِ قابل‌دیدن و خروجِ قابل‌دسترسی با کیبورد دارد', () => {
  const sidebar = source('components/layout/dashboard/sidebar-content.tsx');

  assert.match(sidebar, /aria-current=\{isActive \? 'page' : undefined\}/);
  assert.match(sidebar, /aria-label="منوی حساب کاربری"/);
  assert.match(sidebar, /focus-visible:ring-2/);
  // خروج یک دکمه واقعی است (قابل فوکوس و فعال‌سازی با کیبورد)
  assert.match(sidebar, /<button\s+type="button"/);
  assert.doesNotMatch(
    sidebar,
    /<div\s+onClick=\{handleLogout\}/,
    'خروج نباید یک div با onClick باشد',
  );
});

test('شماره سفارش در RTL و صفحه‌های باریک سرریز نمی‌کند', () => {
  const recent = source('components/dashboard/recent-orders.tsx');
  const item = source('components/dashboard/order-item.tsx');

  for (const file of [recent, item]) {
    assert.match(file, /dir="ltr"/, 'شماره سفارش باید LTR باشد');
    assert.match(file, /break-all/, 'شماره سفارش باید بشکند نه سرریز');
    assert.match(file, /min-w-0/, 'ستونِ متغیر باید min-w-0 داشته باشد');
  }
});
