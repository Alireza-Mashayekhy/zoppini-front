import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { before, test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import WalletChargeForm from '../components/dashboard/wallet/wallet-charge-form';
import DashboardPage from '../app/(user)/dashboard/page';
import OrderItem from '../components/dashboard/order-item';
import { useAuthStore } from '../store/auth.store';

/**
 * رندرِ واقعیِ داشبورد با داده‌ی شبیه‌سازی‌شده.
 *
 * چرا این تست مهم است: باگِ اصلی (نمایشِ سفارشِ لغوشده به‌عنوان «تحویل شده»)
 * در **نحوه‌ی نمایش** بود، نه در داده؛ بنابراین باید خروجیِ رندر شده بررسی
 * شود. داده‌ی این تست همان سناریوی گزارش‌شده است: ۳ سفارش — ۲ در انتظار
 * پرداخت و ۱ لغو شده — و هیچ سفارش تحویل‌شده‌ای.
 *
 * کامپوننت‌های کلاینتی با `renderToStaticMarkup` و یک QueryClientِ از پیش
 * پرشده رندر می‌شوند تا نیازی به شبکه یا مرورگر نباشد.
 */

const ordersPayload = {
  status: 200,
  message: 'ok',
  data: [
    {
      id: 101,
      orderNumber: 'ZP-14040101-101',
      totalPrice: 4_500_000,
      shippingCost: 0,
      discount: 0,
      finalPrice: 4_500_000,
      walletPayment: '0',
      clubCreditPayment: '0',
      status: 'pending',
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
      items: [],
    },
    {
      id: 102,
      orderNumber: 'ZP-14040102-102',
      totalPrice: 2_100_000,
      shippingCost: 0,
      discount: 0,
      finalPrice: 2_100_000,
      walletPayment: '0',
      clubCreditPayment: '0',
      status: 'pending',
      createdAt: '2026-11-02T10:00:00.000Z',
      updatedAt: '2026-11-02T10:00:00.000Z',
      items: [],
    },
    {
      id: 100,
      orderNumber: 'ZP-14040100-100',
      totalPrice: 990_000,
      shippingCost: 0,
      discount: 0,
      finalPrice: 990_000,
      walletPayment: '0',
      clubCreditPayment: '0',
      status: 'cancelled',
      createdAt: '2026-10-28T10:00:00.000Z',
      updatedAt: '2026-10-29T10:00:00.000Z',
      items: [],
    },
  ],
  pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
  // همان آماری که سرور برای این داده می‌فرستد
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
  stats2: null,
};

const walletPayload = {
  status: 200,
  message: 'ok',
  data: {
    id: 5,
    balance: '250000.00',
    totalCharged: '1000000.00',
    totalSpent: '750000.00',
    totalRefunded: '0.00',
    createdAt: '2026-01-05T10:00:00.000Z',
  },
};

const clubPayload = {
  status: 200,
  message: 'ok',
  data: {
    TotalPoint: 1200,
    AvailableCredit: 500000,
    RegisterDate: '2025-05-01T00:00:00',
  },
};

/**
 * رندرِ داشبورد با کاربرِ دلخواه.
 *
 * نکته: zustand در رندرِ سمت سرور از `getInitialState` استفاده می‌کند، نه از
 * `getState`؛ بنابراین برای تزریقِ نامِ کاربر همان state اولیه را برای مدتِ
 * رندر عوض می‌کنیم و بعد برمی‌گردانیم.
 */
function renderDashboard(userName?: string) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        retry: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  client.setQueryData(['orders'], ordersPayload);
  client.setQueryData(['wallet'], walletPayload);
  client.setQueryData(['club', 'me'], clubPayload);

  const originalInitialState = useAuthStore.getInitialState;

  if (userName) {
    useAuthStore.getInitialState = () =>
      ({ ...originalInitialState(), user: { fullName: userName } }) as never;
  }

  try {
    return renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <DashboardPage />
      </QueryClientProvider>,
    );
  } finally {
    useAuthStore.getInitialState = originalInitialState;
  }
}

let html = '';

before(() => {
  html = renderDashboard('علی رضایی');
});

/** مقدارِ عددیِ یک کارت خلاصه بر اساس کلیدش */
function summaryValue(key: string): string {
  const match = html.match(
    new RegExp(
      `data-summary-card="${key}"[\\s\\S]*?<p class="mt-2 text-3xl font-light text-\\[#1A1A1A\\]">([^<]*)</p>`,
    ),
  );

  assert.ok(match, `کارت ${key} در خروجی پیدا نشد`);

  return match[1].trim();
}

/** بخشِ HTML مربوط به یک سفارش در فهرست سفارش‌های اخیر */
function orderCard(id: number): string {
  const start = html.indexOf(`data-order-card="${id}"`);

  assert.notEqual(start, -1, `کارت سفارش ${id} پیدا نشد`);

  const next = html.indexOf('data-order-card="', start + 1);

  return html.slice(start, next === -1 ? html.length : next);
}

test('سناریوی گزارش‌شده: ۳ سفارش، ۲ در انتظار پرداخت، ۰ تحویل شده، ۱ لغو شده', () => {
  assert.equal(summaryValue('total'), '3');
  assert.equal(summaryValue('awaitingPayment'), '2');
  assert.equal(summaryValue('delivered'), '0');
  assert.equal(summaryValue('cancelled'), '1');
});

test('برچسبِ «تحویل شده» دیگر عددِ لغوشده را نشان نمی‌دهد', () => {
  const deliveredCard = html.match(
    /data-summary-card="delivered"[\s\S]*?<\/a>/,
  )?.[0];

  assert.ok(deliveredCard);
  assert.match(deliveredCard, /تحویل شده/);
  // عددِ این کارت باید ۰ باشد (قبلاً ۱/تعداد لغوشده‌ها را نشان می‌داد)
  assert.match(deliveredCard, /text-3xl[^>]*>0</);
});

test('سربرگ برند است و متنِ قدیمی حذف شده', () => {
  assert.match(html, /پنل مشتریان زوپینی/);
  assert.match(html, /<h1[^>]*>سلام<\/h1>/);
  assert.doesNotMatch(html, /خلاصه‌ای از فعالیت‌های شما در پنل/);
  assert.doesNotMatch(html, /خوش آمدید/);
});

test('سلام با نامِ کاربر شخصی می‌شود (و بدون نام جای خالی نمی‌ماند)', () => {
  const page = readFileSync(
    resolve(__dirname, '..', 'app/(user)/dashboard/page.tsx'),
    'utf8',
  );

  // نام از استور خوانده و trim می‌شود؛ نبودِ نام یعنی فقط «سلام»
  assert.match(page, /user\?\.fullName\?\.trim\(\)/);
  assert.match(page, /greetingName \? `سلام، \$\{greetingName\}` : 'سلام'/);
});

test('خلاصه و فهرست سفارش‌ها ساختار معنایی و heading دارند', () => {
  assert.match(html, /<h1[^>]*>/);
  assert.match(html, /id="orders-summary-title"/);
  assert.match(html, /id="recent-orders-title"/);
  assert.match(html, /aria-labelledby="orders-summary-title"/);
  assert.match(html, /dir="rtl"/);
});

test('سفارشِ در انتظار پرداخت هر دو اقدام را دارد، سفارشِ لغو شده هیچ‌کدام را', () => {
  const pending = orderCard(101);

  assert.match(pending, /در انتظار پرداخت/);
  assert.match(pending, /پرداخت سفارش/);
  assert.match(pending, /لغو سفارش/);
  assert.match(pending, /جزئیات سفارش/);

  const cancelled = orderCard(100);

  assert.match(cancelled, /لغو شده/);
  assert.doesNotMatch(cancelled, /پرداخت سفارش/);
  assert.doesNotMatch(cancelled, /لغو سفارش/);
  // اما هنوز می‌تواند باز شود
  assert.match(cancelled, /جزئیات سفارش/);
});

test('هر سفارش شماره، تاریخ و مبلغ را نشان می‌دهد و شماره LTR است', () => {
  const pending = orderCard(101);

  assert.match(pending, /ZP-14040101-101/);
  assert.match(pending, /dir="ltr"/);
  assert.match(pending, /break-all/);
  assert.match(pending, /تومان/);
  assert.match(pending, /href="\/dashboard\/orders\?order=101"/);
});

test('کیف پول و باشگاه مشتریان نقشِ مکمل دارند (پس از سفارش‌ها)', () => {
  const ordersIndex = html.indexOf('سفارش‌های اخیر');
  const walletIndex = html.indexOf('اعتبار و امتیاز شما');

  assert.ok(ordersIndex > -1 && walletIndex > ordersIndex);
  assert.match(html, /موجودی کیف پول/);
  assert.match(html, /href="\/dashboard\/wallet"/);
  assert.match(html, /href="\/dashboard\/club"/);
});

test('هیچ عددِ گمراه‌کننده‌ای برای سفارش‌های تحویلی نمایش داده نمی‌شود', () => {
  // نوارِ «در حال آماده‌سازی یا ارسال» فقط وقتی چیزی در جریان است می‌آید
  assert.equal(ordersPayload.stats.processing + ordersPayload.stats.shipped, 0);
  assert.doesNotMatch(html, /در حال آماده‌سازی یا ارسال/);
});

test('حالت خالی: بدون سفارش، عدد صفر و پیامِ راهنما نمایش داده می‌شود', () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, retry: false, refetchOnMount: false },
    },
  });

  client.setQueryData(['orders'], {
    ...ordersPayload,
    data: [],
    stats: {
      total: 0,
      awaitingPayment: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      unknown: 0,
      inProgress: 0,
    },
  });
  client.setQueryData(['wallet'], walletPayload);
  client.setQueryData(['club', 'me'], clubPayload);

  const emptyHtml = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <DashboardPage />
    </QueryClientProvider>,
  );

  assert.match(emptyHtml, /هنوز سفارشی ثبت نکرده‌اید/);
  assert.match(emptyHtml, /data-summary-card="delivered"[\s\S]{0,400}>0</);
  assert.match(emptyHtml, /شروع خرید/);
});


/* ==================================================================== */
/* شارژ کیف پول                                                        */
/* ==================================================================== */

function renderWalletCharge() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, retry: false, refetchOnMount: false },
    },
  });

  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <WalletChargeForm />
    </QueryClientProvider>,
  );
}

test('شارژ کیف پول فقط زرین‌پال را نشان می‌دهد (دیجی‌پی و تارا حذف شده‌اند)', () => {
  const markup = renderWalletCharge();

  assert.match(markup, /زرین‌پال/);
  assert.doesNotMatch(markup, /دیجی‌?پی/);
  assert.doesNotMatch(markup, /تارا/);
  assert.doesNotMatch(markup, /بانک ملت/);
});

test('شارژ کیف پول مبالغ سریع، ورودی مبلغ و دکمه پرداخت را حفظ کرده است', () => {
  const markup = renderWalletCharge();

  assert.match(markup, /شارژ کیف پول/);
  assert.match(markup, /مبلغ شارژ \(تومان\)/);
  assert.match(markup, /500,000/);
  assert.match(markup, /ادامه و پرداخت/);
  assert.match(markup, /درگاه پرداخت/);
});

/* ==================================================================== */
/* ردیف سفارش در صفحه سفارش‌ها                                         */
/* ==================================================================== */

function renderOrderItem(status: string) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, retry: false, refetchOnMount: false },
    },
  });

  const order = { ...ordersPayload.data[0], status };

  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <OrderItem order={order as never} expanded={false} onToggle={() => {}} />
    </QueryClientProvider>,
  );
}

test('ردیف سفارش یک دکمه‌ی واقعی با aria-expanded است', () => {
  const markup = renderOrderItem('pending');

  assert.match(markup, /<button type="button"/);
  assert.match(markup, /aria-expanded="false"/);
  assert.match(markup, /aria-controls=/);
});

test('وضعیت ناشناس در ردیف سفارش به‌جای خطا برچسب «نامشخص» می‌گیرد', () => {
  const markup = renderOrderItem('delivered_to_store');

  assert.match(markup, /نامشخص/);
});

test('جزئیاتِ سفارشِ در انتظار پرداخت: پرداخت و لغو؛ سفارشِ تحویل‌شده: بدون اقدام', () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, retry: false, refetchOnMount: false },
    },
  });

  const render = (status: string) =>
    renderToStaticMarkup(
      <QueryClientProvider client={client}>
        <OrderItem
          order={{ ...ordersPayload.data[0], status } as never}
          expanded
          onToggle={() => {}}
        />
      </QueryClientProvider>,
    );

  const pending = render('pending');

  assert.match(pending, /قابل پرداخت/);
  assert.match(pending, /پرداخت سفارش/);
  assert.match(pending, /لغو سفارش/);

  const delivered = render('delivered');

  assert.match(delivered, /تحویل شده/);
  assert.doesNotMatch(delivered, /پرداخت سفارش/);
  assert.doesNotMatch(delivered, /لغو سفارش/);
  assert.match(delivered, /این سفارش تکمیل شده است/);

  const paid = render('paid');

  assert.match(paid, /پرداخت شده/);
  assert.doesNotMatch(paid, /پرداخت سفارش/);
  // سرور لغوِ سفارش پرداخت‌شده را نمی‌پذیرد، پس دکمه‌ای هم نشان داده نمی‌شود
  assert.doesNotMatch(paid, /لغو سفارش/);
});
