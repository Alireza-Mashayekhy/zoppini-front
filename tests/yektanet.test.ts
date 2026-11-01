import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  YEKTANET_ACCOUNT_ID,
  YEKTANET_HEAD_SCRIPT,
  YEKTANET_INLINE_SCRIPT_ID,
  YEKTANET_SCRIPT_ID,
} from '../lib/analytics/yektanet';
import {
  CONSENT_MAX_AGE_SECONDS,
  currentConsent,
  MARKETING_FLAG_COOKIE,
  marketingGranted,
  writeMarketingFlag,
} from '../lib/consent/grant';
import { CATEGORY_VERSION, Consent, POLICY } from '../lib/consent/policy';

const consent = (over: Partial<Consent> = {}): Consent => ({
  policy: POLICY,
  categories: CATEGORY_VERSION,
  at: new Date().toISOString(),
  preferences: false,
  analytics: false,
  marketing: true,
  ...over,
});

type FakeScript = {
  id: string;
  src: string;
  async: boolean | number;
  type: string;
  dataset: Record<string, string>;
};

/** Minimal DOM: enough for the inline gate plus the untouched vendor loader. */
function fakeDocument(initialCookie: string) {
  const byId = new Map<string, FakeScript>();
  const order: FakeScript[] = [];
  const first = {
    id: 'next-chunk',
    src: '/_next/static/chunk.js',
    async: true,
    type: 'text/javascript',
    dataset: {} as Record<string, string>,
  };
  byId.set(first.id, first);
  order.push(first);

  const head = {
    insertBefore(script: FakeScript) {
      order.unshift(script);
      byId.set(script.id, script);
      return script;
    },
  };
  const firstNode = { ...first, parentNode: head };

  const document = {
    cookie: initialCookie,
    getElementById: (id: string) => byId.get(id) ?? null,
    createElement: (tag: string) => {
      assert.equal(tag, 'script');
      return {
        id: '',
        src: '',
        async: false,
        type: '',
        dataset: {} as Record<string, string>,
      };
    },
    getElementsByTagName: (tag: string) => {
      assert.equal(tag, 'script');
      return [firstNode];
    },
  };
  return { document, byId, order };
}

function runGate(document: unknown, window: unknown) {
  // Same code path the browser executes while parsing <head>.
  new Function('window', 'document', YEKTANET_HEAD_SCRIPT)(window, document);
}

function fakeWindow() {
  const listeners: Record<string, (() => void)[]> = {};
  return {
    addEventListener(name: string, fn: () => void) {
      (listeners[name] ||= []).push(fn);
    },
    emit(name: string) {
      for (const fn of listeners[name] || []) fn();
    },
    listeners,
  };
}

test('the head gate loads Yektanet on parse time only with marketing consent', () => {
  const denied = fakeDocument(`zp_consent=signed-value; zp_marketing=`);
  const deniedWindow = fakeWindow();
  runGate(denied.document, deniedWindow);
  assert.equal(denied.byId.get(YEKTANET_SCRIPT_ID), undefined);
  assert.equal(denied.order.length, 1, 'no vendor script was inserted');

  const granted = fakeDocument('zp_consent=signed-value; zp_marketing=1');
  const grantedWindow = fakeWindow();
  runGate(granted.document, grantedWindow);
  const script = granted.byId.get(YEKTANET_SCRIPT_ID);
  assert.ok(script, 'vendor script is inserted during the first parse pass');
  assert.equal(script.id, `ua-script-${YEKTANET_ACCOUNT_ID}`);
  assert.equal(script.async, 1);
  assert.equal(script.type, 'text/javascript');
  assert.match(
    script.src,
    new RegExp(
      `^https://cdn\\.yektanet\\.com/rg_woebegone/scripts_v3/${YEKTANET_ACCOUNT_ID}/rg\\.complete\\.js\\?v=\\d+$`,
    ),
  );
  // Inserted before the first script of the document, i.e. ahead of the app.
  assert.equal(granted.order[0], script);
});

test('the gate never trusts a look-alike flag value', () => {
  for (const cookie of [
    'zp_marketing=10',
    'zp_marketing=1x',
    'xzp_marketing=1',
    'marketing=1',
  ]) {
    const { document, byId } = fakeDocument(cookie);
    runGate(document, fakeWindow());
    assert.equal(byId.get(YEKTANET_SCRIPT_ID), undefined, cookie);
  }
});

test('granting in the same page loads once; a second notice never duplicates', () => {
  const { document, byId } = fakeDocument('zp_consent=signed-value');
  const window = fakeWindow();
  runGate(document, window);
  assert.equal(byId.get(YEKTANET_SCRIPT_ID), undefined);

  document.cookie = 'zp_marketing=1';
  window.emit('privacy-changed');
  assert.ok(byId.get(YEKTANET_SCRIPT_ID));

  let created = 0;
  const original = document.createElement;
  document.createElement = (tag: string) => {
    created++;
    return original(tag);
  };
  window.emit('privacy-changed');
  window.emit('privacy-changed');
  assert.equal(created, 0, 'the vendor loader runs at most once per page');
});

test('the snippet is not deferred behind load, interaction or timers', () => {
  for (const forbidden of [
    'setTimeout',
    'DOMContentLoaded',
    'lazyOnload',
    'requestIdleCallback',
    'addEventListener("load"',
    "addEventListener('load'",
  ]) {
    assert.equal(
      YEKTANET_HEAD_SCRIPT.includes(forbidden),
      false,
      `${forbidden} must not gate the script`,
    );
  }
  assert.equal(YEKTANET_INLINE_SCRIPT_ID, 'yektanet-analytics');
  assert.match(YEKTANET_HEAD_SCRIPT, /cdn\.yektanet\.com/);
  // The vendor snippet must stay recognisable for Yektanet support.
  assert.match(YEKTANET_HEAD_SCRIPT, /yektanetAnalyticsObject/);
  assert.match(
    YEKTANET_HEAD_SCRIPT,
    /getElementsByTagName\("script"\)\[0\]/,
  );
});

test('marketing consent must match the current policy and be unexpired', () => {
  assert.equal(marketingGranted(consent()), true);
  assert.equal(marketingGranted(consent({ marketing: false })), false);
  assert.equal(marketingGranted(null), false);
  assert.equal(marketingGranted(consent({ policy: '2026-10-27.1' })), false);
  assert.equal(marketingGranted(consent({ categories: 'necessary' })), false);
  assert.equal(marketingGranted(consent({ at: 'not-a-date' })), false);
  const stale = new Date(
    Date.now() - (CONSENT_MAX_AGE_SECONDS + 60) * 1000,
  ).toISOString();
  assert.equal(marketingGranted(consent({ at: stale })), false);
  assert.equal(currentConsent(consent())?.marketing, true);
});

test('the readable mirror is written and cleared for scripts', () => {
  const written: string[] = [];
  Object.assign(globalThis, {
    document: {
      set cookie(value: string) {
        written.push(value);
      },
    },
    location: { protocol: 'https:' },
  });
  try {
    writeMarketingFlag(true);
    writeMarketingFlag(false);
  } finally {
    Reflect.deleteProperty(globalThis, 'document');
    Reflect.deleteProperty(globalThis, 'location');
  }
  assert.match(
    written[0],
    new RegExp(
      `^${MARKETING_FLAG_COOKIE}=1; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax; Secure$`,
    ),
  );
  assert.match(written[1], /^zp_marketing=; Path=\/; Max-Age=0; SameSite=Lax/);
});
