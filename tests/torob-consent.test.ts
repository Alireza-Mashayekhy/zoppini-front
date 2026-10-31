import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';

import { NextRequest } from 'next/server';

import { handlePrivacyPost } from '../lib/consent/handler';
import { CATEGORY_VERSION, POLICY } from '../lib/consent/policy';
import { sign, verify } from '../lib/consent/server';

test('Torob click and checkout context require marketing consent; withdrawal revokes', async () => {
  process.env.PRIVACY_SIGNING_SECRET =
    'test-privacy-signing-secret-32-characters';
  process.env.PRIVACY_PROXY_SECRET = 'test-proxy-secret-at-least-32-characters';
  process.env.PRIVACY_API_URL = 'https://backend.test/api';
  process.env.TOROB_TRACKING_ENABLED = 'true';
  process.env.TOROB_ATTRIBUTION_SECRET =
    'test-torob-secret-at-least-32-characters';
  const calls: Array<{ url: string; body: any }> = [];
  const oldFetch = globalThis.fetch;
  globalThis.fetch = (async (
    url: string | URL | Request,
    init?: RequestInit,
  ) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
    return new Response('{}', { status: 200 });
  }) as typeof fetch;
  const make = (action: string, body: object, cookie = '') =>
    new NextRequest(`https://shop.test/privacy/${action}`, {
      method: 'POST',
      headers: {
        origin: 'https://shop.test',
        'content-type': 'application/json',
        cookie,
      },
      body: JSON.stringify(body),
    });
  try {
    const blocked = await handlePrivacyPost(
      make('torob-click', { clid: 'click-123', clickedAt: Date.now() }),
      'torob-click',
    );
    assert.equal(blocked.status, 403);
    assert.equal(calls.length, 0);
    const consent = sign({
      policy: POLICY,
      categories: CATEGORY_VERSION,
      at: new Date().toISOString(),
      marketing: true,
      preferences: false,
      analytics: false,
    });
    const click = await handlePrivacyPost(
      make(
        'torob-click',
        { clid: 'click-123', clickedAt: Date.now() },
        `zp_consent=${consent}`,
      ),
      'torob-click',
    );
    assert.equal(click.status, 200);
    assert.equal(calls[0].body.action, 'register');
    const clickCookie = click.cookies.get('zp_torob_click')?.value;
    const grantCookie = click.cookies.get('zp_torob_grant')?.value;
    assert.ok(clickCookie && grantCookie);
    const cookie = `zp_consent=${consent}; zp_torob_click=${clickCookie}; zp_torob_grant=${grantCookie}`;
    const context = await handlePrivacyPost(
      make('torob-context', {}, cookie),
      'torob-context',
    );
    const token = (await context.json()).token as string;
    const [body, sig] = token.split('.');
    assert.equal(
      sig,
      createHmac('sha256', process.env.TOROB_ATTRIBUTION_SECRET!)
        .update(body)
        .digest('base64url'),
    );
    assert.equal(
      JSON.parse(Buffer.from(body, 'base64url').toString()).clid,
      'click-123',
    );
    // Refreshing a product URL does not extend attribution.
    const again = await handlePrivacyPost(
      make('torob-click', { clid: 'click-123', clickedAt: Date.now() }, cookie),
      'torob-click',
    );
    assert.equal(
      verify<{ clickedAt: number }>(again.cookies.get('zp_torob_click')?.value)
        ?.clickedAt,
      verify<{ clickedAt: number }>(clickCookie)?.clickedAt,
    );
    const revoked = await handlePrivacyPost(
      make(
        'consent',
        {
          choice: 'reject',
          marketing: false,
          analytics: false,
          preferences: false,
        },
        cookie,
      ),
      'consent',
    );
    assert.equal(revoked.status, 200);
    assert.ok(
      calls.some(
        call =>
          call.body.action === 'revoke' &&
          call.body.grantId === calls[0].body.grantId,
      ),
    );
    assert.equal(revoked.cookies.get('zp_torob_click')?.value, '');
    const noConsent = await handlePrivacyPost(
      make('torob-context', {}, `zp_torob_click=${clickCookie}`),
      'torob-context',
    );
    assert.equal(noConsent.status, 403);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test('expired click never becomes an attribution context', async () => {
  process.env.PRIVACY_SIGNING_SECRET =
    'test-privacy-signing-secret-32-characters';
  process.env.TOROB_TRACKING_ENABLED = 'true';
  process.env.TOROB_ATTRIBUTION_SECRET =
    'test-torob-secret-at-least-32-characters';
  const { grantForConsent } = await import('../lib/consent/torob-server');
  const consent = sign({
    policy: POLICY,
    categories: CATEGORY_VERSION,
    at: new Date().toISOString(),
    marketing: true,
    preferences: false,
    analytics: false,
  });
  const click = sign({
    grantId: grantForConsent(consent),
    clid: 'old-click',
    clickedAt: Date.now() - 7 * 86400000,
  });
  const req = new NextRequest('https://shop.test/privacy/torob-context', {
    method: 'POST',
    headers: {
      origin: 'https://shop.test',
      'content-type': 'application/json',
      cookie: `zp_consent=${consent}; zp_torob_click=${click}`,
    },
    body: '{}',
  });
  const response = await handlePrivacyPost(req, 'torob-context');
  assert.deepEqual(await response.json(), { token: '' });
});

test('failed grant revocation clears opt-in but retains a retry handle', async () => {
  process.env.PRIVACY_SIGNING_SECRET =
    'test-privacy-signing-secret-32-characters';
  process.env.TOROB_TRACKING_ENABLED = 'true';
  process.env.TOROB_ATTRIBUTION_SECRET =
    'test-torob-secret-at-least-32-characters';
  process.env.PRIVACY_API_URL = 'https://backend.test/api';
  const oldFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response('{}', { status: 503 })) as typeof fetch;
  try {
    const consent = sign({
      policy: POLICY,
      categories: CATEGORY_VERSION,
      at: new Date().toISOString(),
      marketing: true,
      preferences: false,
      analytics: false,
    });
    const req = new NextRequest('https://shop.test/privacy/consent', {
      method: 'POST',
      headers: {
        origin: 'https://shop.test',
        'content-type': 'application/json',
        cookie: `zp_consent=${consent}`,
      },
      body: JSON.stringify({
        choice: 'reject',
        preferences: false,
        analytics: false,
        marketing: false,
      }),
    });
    const response = await handlePrivacyPost(req, 'consent');
    assert.equal(response.status, 503);
    assert.equal(response.cookies.get('zp_consent')?.value, '');
    const handle = verify<{ ids: string[] }>(
      response.cookies.get('zp_torob_grant')?.value,
    );
    assert.equal(handle?.ids.length, 1);
  } finally {
    globalThis.fetch = oldFetch;
  }
});
