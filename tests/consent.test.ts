import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  analyticsContext,
  getConsent,
  setConsent,
  track,
} from '../lib/consent/client';
import { privacyUrl } from '../lib/consent/endpoints';
import {
  CATEGORY_VERSION,
  Consent,
  denied,
  POLICY,
  toSelection,
} from '../lib/consent/policy';

test('optional collection is fail closed, strips URLs, and withdrawal stops collection', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  Object.assign(globalThis, {
    window: { dispatchEvent: () => true, innerWidth: 1100 },
    location: {
      pathname: '/products/example',
      search:
        '?email=redacted&utm_source=google&utm_medium=email&utm_campaign=private-name',
    },
    document: { referrer: 'https://example.test/path?private=redacted' },
    fetch: async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return { ok: true, json: async () => ({ token: 'test-token' }) };
    },
  });
  setConsent(null);
  assert.equal(getConsent(), null);
  await track('page_view');
  assert.equal(await analyticsContext(), '');
  assert.equal(calls.length, 0);
  setConsent({
    policy: POLICY,
    categories: CATEGORY_VERSION,
    at: new Date().toISOString(),
    analytics: true,
    preferences: false,
    marketing: false,
  });
  await track('page_view');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, privacyUrl('event'));
  assert.equal(await analyticsContext(), 'test-token');
  assert.equal(calls[1].url, privacyUrl('context'));
  const body = JSON.parse(String(calls[0].init?.body));
  assert.equal(body.source, 'google');
  assert.equal(body.medium, 'email');
  assert.equal(body.campaign, undefined);
  assert.equal(body.referrer, 'example.test');
  assert.equal(body.device, 'desktop');
  assert.equal(body.visitor, undefined);
  assert.equal(body.user_id, undefined);
  assert.equal(body.path, undefined);
  assert.equal(String(calls[0].init?.body).includes('redacted'), false);
  setConsent(null);
  await track('add_to_cart', { variant: 1 });
  assert.equal(calls.length, 2);
});

test('stored consent metadata never leaks into the BFF consent payload', () => {
  const stored: Consent = {
    ...denied,
    policy: POLICY,
    categories: CATEGORY_VERSION,
    at: new Date().toISOString(),
  };
  assert.deepEqual(toSelection(stored), denied);
  assert.deepEqual(toSelection(null), denied);
  assert.deepEqual(
    Object.keys({ ...toSelection(stored), choice: 'custom' }).sort(),
    ['analytics', 'choice', 'marketing', 'preferences'],
  );
});
