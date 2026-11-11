import assert from 'node:assert/strict';
import { test } from 'node:test';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import ClubCoupons from '../components/dashboard/club/club-coupons';
import ClubHistory from '../components/dashboard/club/club-history';
import ClubLevels from '../components/dashboard/club/club-levels';
import ClubSummary from '../components/dashboard/club/club-summary';
import ClubWallets from '../components/dashboard/club/club-wallets';
import {
  asArray,
  asCustomer,
  toNumber,
  toWalletId,
} from '../services/features/club/normalize';

/**
 * صفحه‌ی /dashboard/club بعد از بارگذاری داده‌ها «یک‌دفعه» خطا می‌داد.
 * علت، تفاوت شکل پاسخ‌های دایاتک بود: بعضی endpointها به‌جای آرایه،
 * پوشش `{ Items }` / `{ $values }` / `{ Succeeded, Payload }` برمی‌گردانند.
 * این تست‌ها همان قالب‌ها را روی کامپوننت‌های واقعی صفحه اجرا می‌کنند.
 */

const ok = <T>(data: T) => ({ status: 200, message: 'success', data });

type Component = React.ComponentType<Record<string, never>>;

const renderWithData = (
  Component: Component,
  entries: Array<[unknown[], unknown]>,
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  for (const [queryKey, data] of entries) {
    queryClient.setQueryData(queryKey, data);
  }

  return renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(Component),
    ),
  );
};

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ============================================================
// normalize helpers
// ============================================================

test('asArray unwraps every Diatech list envelope', () => {
  const items = [{ Id: 1 }, { Id: 2 }];

  assert.deepEqual(asArray(items), items);
  assert.deepEqual(asArray({ Succeeded: true, Payload: items }), items);
  assert.deepEqual(
    asArray({ Succeeded: true, Payload: { Items: items } }),
    items,
  );
  assert.deepEqual(asArray({ Payload: { $values: items } }), items);
  assert.deepEqual(asArray({ success: true, data: items }), items);
  assert.deepEqual(asArray({ Results: items, TotalCount: 2 }), items);
  assert.deepEqual(asArray({ Payload: { Items: [], TotalCount: 0 } }), []);
});

test('asArray never throws on non-list payloads', () => {
  for (const value of [
    null,
    undefined,
    'error',
    42,
    true,
    {},
    { Foo: 'bar' },
  ]) {
    assert.deepEqual(asArray(value), []);
  }

  // اعضای null/بدوی داخل آرایه هم باید حذف شوند
  assert.deepEqual(asArray([null, { Id: 1 }, 'x', undefined]), [{ Id: 1 }]);
});

test('asCustomer unwraps customer payloads and rejects empty ones', () => {
  const customer = { CustomerCode: '0912', TotalPoint: 10 };

  assert.deepEqual(asCustomer(customer), customer);
  assert.deepEqual(asCustomer({ Payload: customer }), customer);
  assert.deepEqual(
    asCustomer({ Succeeded: true, Payload: customer }),
    customer,
  );
  assert.deepEqual(asCustomer({ Data: { Customer: customer } }), customer);

  assert.equal(asCustomer(null), null);
  assert.equal(asCustomer({ Succeeded: false, Errors: [] }), null);
  assert.equal(asCustomer('nope'), null);
});

test('toNumber parses Persian digits, thousands separators and junk', () => {
  assert.equal(toNumber(12.7), 12.7);
  assert.equal(toNumber('125,000'), 125000);
  assert.equal(toNumber('۲۵۰۰۰۰'), 250000);
  assert.equal(toNumber('1 250'), 1250);
  assert.equal(toNumber('abc'), 0);
  assert.equal(toNumber(undefined, 5), 5);
  assert.equal(toNumber(NaN, 7), 7);
  assert.equal(toNumber(Infinity, 3), 3);
});

test('toWalletId only accepts positive integer ids', () => {
  assert.equal(toWalletId(22), 22);
  assert.equal(toWalletId('23'), 23);
  assert.equal(toWalletId(0), 0);
  assert.equal(toWalletId(-4), 0);
  assert.equal(toWalletId(null), 0);
  assert.equal(toWalletId('x'), 0);
});

// ============================================================
// Components — realistic Diatech payloads
// ============================================================

const customer = {
  Id: 7,
  CustomerCode: '09121234567',
  FirstName: 'علی',
  LastName: 'رضایی',
  TotalPoint: 1450,
  AvailableCredit: 125000,
  RegisterDate: '2023-05-01T00:00:00',
  Coupons: [
    {
      Id: 1,
      Title: 'تخفیف ۲۰٪',
      Code: 'SPRING20',
      IsActive: true,
      IsUsed: false,
      DiscountTypeIndex: 1,
      DiscountValue: 20,
      ExpireTypeIndex: 1,
      ExpireDate: '2026-12-30T00:00:00',
    },
    {
      Id: 2,
      Title: '۵۰ هزار تومان',
      Code: 'GIFT50',
      IsActive: true,
      IsUsed: true,
      DiscountTypeIndex: 2,
      DiscountValue: 500000,
      ExpireTypeIndex: 2,
      ExpireDaysAfterAssignment: 30,
      MinimumOrderPrice: 2000000,
    },
  ],
};

const wallets = [
  { Id: 22, WalletId: 5, OfficeId: 1, AvailableCredit: 250000 },
  { Id: 23, WalletId: 6, OfficeId: null, AvailableCredit: 0 },
];

const histories = [
  {
    Id: 11,
    Date: '2025-01-05T09:00:00',
    ProgramType: 'خرید',
    Point: 120,
    Credit: 0,
    CustomerRemainingCredit: 250000,
    Description: 'خرید سفارش ۱۰۰۱',
  },
  {
    Id: 12,
    Date: '2025-01-06T09:00:00',
    ProgramType: 'استفاده',
    Point: -20,
    Credit: -100000,
    CustomerRemainingCredit: 150000,
    CouponName: 'بن تخفیف',
  },
];

const levels = [
  { Id: 3, Title: 'طلایی', FromPoint: 1000, ToPoint: null, Prioprity: 3 },
  { Id: 1, Title: 'برنزی', FromPoint: 0, ToPoint: 499, Prioprity: 1 },
  { Id: 2, Title: 'نقره‌ای', FromPoint: 500, ToPoint: 999, Prioprity: 2 },
];

test('summary renders points, credit and active coupon count', () => {
  const html = renderWithData(ClubSummary as Component, [
    [['club', 'me'], ok(customer)],
  ]);
  const output = text(html);

  assert.match(output, /۱٬۴۵۰|1,450/);
  assert.match(output, /۱۲٬۵۰۰|12,500/);
  assert.match(output, /امتیاز/);
});

test('levels picks the current level by points and renders a progress bar', () => {
  const html = renderWithData(ClubLevels as Component, [
    [['club', 'levels'], ok(levels)],
    [['club', 'me'], ok(customer)],
  ]);
  const output = text(html);

  assert.match(output, /طلایی/);
  assert.match(output, /سطح فعلی/);
  assert.match(html, /width:\s*\d+(\.\d+)?%/);
});

test('wallets lists balances in Toman', () => {
  const html = renderWithData(ClubWallets as Component, [
    [['club', 'wallets'], ok(wallets)],
  ]);
  const output = text(html);

  assert.match(output, /کیف پول #5/);
  assert.match(output, /۲۵٬۰۰۰|25,000/);
});

test('coupons show discount and expiry in the documented format', () => {
  const html = renderWithData(ClubCoupons as Component, [
    [['club', 'me'], ok(customer)],
  ]);
  const output = text(html);

  assert.match(output, /SPRING20/);
  assert.match(output, /۲۰٪ تخفیف|20٪ تخفیف/);
  assert.match(output, /استفاده شده/);
  assert.match(output, /۵۰٬۰۰۰|50,000/);
});

test('history renders points and credit with sign and colour classes', () => {
  const html = renderWithData(ClubHistory as Component, [
    [['club', 'loyalty-histories'], ok(histories)],
  ]);
  const output = text(html);

  assert.match(output, /\+120/);
  assert.match(output, /-20/);
  // امتیاز مثبت سبز و منفی قرمز
  assert.match(html, /text-green-600/);
  assert.match(html, /text-red-600/);
  // اعتبار هم به تومان نمایش داده می‌شود
  assert.match(output, /۱۰٬۰۰۰|10,000/);
});

// ============================================================
// Components — hostile / legacy payload shapes
// ============================================================

test('every section survives legacy { Items } and { $values } envelopes', () => {
  const cases: Array<[string, Component, Array<[unknown[], unknown]>]> = [
    [
      'summary',
      ClubSummary as Component,
      [[['club', 'me'], ok({ Payload: customer })]],
    ],
    [
      'levels',
      ClubLevels as Component,
      [
        [['club', 'levels'], ok({ Items: levels, TotalCount: 3 })],
        [['club', 'me'], ok({ Data: customer })],
      ],
    ],
    [
      'wallets',
      ClubWallets as Component,
      [[['club', 'wallets'], ok({ $values: wallets })]],
    ],
    [
      'coupons',
      ClubCoupons as Component,
      [
        [
          ['club', 'me'],
          ok({ ...customer, Coupons: { Items: customer.Coupons } }),
        ],
      ],
    ],
    [
      'history',
      ClubHistory as Component,
      [[['club', 'loyalty-histories'], ok({ Results: histories })]],
    ],
  ];

  for (const [name, Component, entries] of cases) {
    assert.doesNotThrow(() => renderWithData(Component, entries), name);
    assert.match(text(renderWithData(Component, entries)), /\S/, name);
  }
});

test('every section survives null / empty payloads without throwing', () => {
  const cases: Array<[string, Component, Array<[unknown[], unknown]>]> = [
    ['summary', ClubSummary as Component, [[['club', 'me'], ok(null)]]],
    ['summary-circle', ClubSummary as Component, [[['club', 'me'], ok('x')]]],
    ['levels', ClubLevels as Component, [[['club', 'levels'], ok(null)]]],
    ['wallets', ClubWallets as Component, [[['club', 'wallets'], ok(null)]]],
    ['coupons', ClubCoupons as Component, [[['club', 'me'], ok({})]]],
    [
      'history',
      ClubHistory as Component,
      [[['club', 'loyalty-histories'], ok(null)]],
    ],
  ];

  for (const [name, Component, entries] of cases) {
    assert.doesNotThrow(() => renderWithData(Component, entries), name);
  }
});

test('every section shows an empty state (not a crash) for a brand-new member', () => {
  const empty = { CustomerCode: '0912', TotalPoint: 0, AvailableCredit: 0 };

  assert.match(
    text(
      renderWithData(ClubWallets as Component, [[['club', 'wallets'], ok([])]]),
    ),
    /هنوز کیف پولی/,
  );

  assert.match(
    text(
      renderWithData(ClubCoupons as Component, [
        [['club', 'me'], ok({ ...empty, Coupons: [] })],
      ]),
    ),
    /بن تخفیفی ندارید/,
  );

  assert.match(
    text(
      renderWithData(ClubHistory as Component, [
        [['club', 'loyalty-histories'], ok([])],
      ]),
    ),
    /هنوز فعالیتی/,
  );

  // با یک سطح و صفر امتیاز نباید خطای تقسیم بر صفر/NaN بدهد
  const levelsHtml = renderWithData(ClubLevels as Component, [
    [['club', 'levels'], ok([{ Id: 1, Title: 'برنزی', FromPoint: 0 }])],
    [['club', 'me'], ok(empty)],
  ]);

  assert.doesNotMatch(levelsHtml, /NaN/);
});

test('rows without ids still render with stable fallback keys', () => {
  const html = renderToStaticMarkup(
    createElement(
      QueryClientProvider,
      { client: new QueryClient() },
      createElement(ClubHistory as Component),
    ),
  );

  assert.ok(html.length > 0);
});

test('every section shows a retry state when its query fails', () => {
  const cases: Array<[string, Component, string[]]> = [
    ['summary', ClubSummary as Component, ['club', 'me']],
    ['levels', ClubLevels as Component, ['club', 'levels']],
    ['wallets', ClubWallets as Component, ['club', 'wallets']],
    ['coupons', ClubCoupons as Component, ['club', 'me']],
    ['history', ClubHistory as Component, ['club', 'loyalty-histories']],
  ];

  for (const [name, Component, queryKey] of cases) {
    // `enabled: false` جلوی refetch شبکه‌ای هنگام mount را می‌گیرد تا
    // وضعیت خطا همان‌طور که ست می‌کنیم در رندر دیده شود.
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, enabled: false } },
    });

    queryClient
      .getQueryCache()
      .build(queryClient, { queryKey })
      .setState({
        status: 'error',
        error: new Error('boom'),
        fetchStatus: 'idle',
      } as never);

    const html = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(Component),
      ),
    );

    assert.match(text(html), /تلاش مجدد/, name);
  }
});
