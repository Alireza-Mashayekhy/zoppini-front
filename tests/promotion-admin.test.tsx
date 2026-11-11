import assert from 'node:assert/strict';
import { test } from 'node:test';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { renderToString } from 'react-dom/server';

import PromotionsPage from '../app/(admin)/admin/promotions/page';
import { EMPTY_PROMOTION_FORM } from '../components/admin/promotion/form-types';
import PromotionForm from '../components/admin/promotion/promotion-form';
import type { Promotion } from '../services/features/promotions/types';

// These components normally receive React's automatic JSX runtime from Next.
Object.assign(globalThis, { React });

function render(ui: React.ReactNode, client = new QueryClient()) {
  try {
    return renderToString(
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
    );
  } finally {
    client.clear();
  }
}

test('create promotion form renders both date pickers with form context', () => {
  const html = render(<PromotionForm onSubmit={() => {}} />);
  assert.match(html, /تاریخ شروع/);
  assert.match(html, /تاریخ پایان/);
  assert.match(html, /name="name"/);
});

test('edit promotion form renders date pickers without crashing', () => {
  const promotion = {
    ...EMPTY_PROMOTION_FORM,
    id: 12,
    name: 'کمپین آزمایشی',
    startsAt: '2026-11-01T09:30:00.000Z',
    expiresAt: '2026-12-01T23:59:00.000Z',
  } as unknown as Promotion;
  const html = render(
    <PromotionForm promotion={promotion} onSubmit={() => {}} />,
  );
  assert.match(html, /تاریخ شروع/);
  assert.match(html, /تاریخ پایان/);
});

test('admin promotions page renders an empty successful list', () => {
  const client = new QueryClient();
  client.setQueryData(['admin-promotions', { search: '' }], { data: [] });
  const html = render(<PromotionsPage />, client);
  assert.match(html, /پیشنهادهای ویژه/);
  assert.match(html, /پروموشنی ثبت نشده است/);
});

test('admin promotions page shows a retryable error rather than an empty list', () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryOnMount: false } },
  });
  client
    .getQueryCache()
    .build(client, {
      queryKey: ['admin-promotions', { search: '' }],
    })
    .setState({
      status: 'error',
      error: new Error('API unavailable'),
      fetchStatus: 'idle',
    });
  const html = render(<PromotionsPage />, client);
  assert.match(html, /role="alert"/);
  assert.match(html, /تلاش مجدد/);
  assert.doesNotMatch(html, /پروموشنی ثبت نشده است/);
});

test('admin promotions page renders a populated list', () => {
  const client = new QueryClient();
  client.setQueryData(['admin-promotions', { search: '' }], {
    data: [
      {
        ...EMPTY_PROMOTION_FORM,
        id: 7,
        name: 'کمپین نمونه',
        status: 'live',
        startsAt: '2026-11-01T00:00:00.000Z',
        expiresAt: '2026-12-01T00:00:00.000Z',
      },
    ],
  });
  const html = render(<PromotionsPage />, client);
  assert.match(html, /کمپین نمونه/);
  assert.doesNotMatch(html, /پروموشنی ثبت نشده است/);
});

test('admin promotions page renders loading placeholders while fetching', () => {
  const html = render(<PromotionsPage />);
  assert.match(html, /data-slot="skeleton"/);
  assert.doesNotMatch(html, /پروموشنی ثبت نشده است/);
});
