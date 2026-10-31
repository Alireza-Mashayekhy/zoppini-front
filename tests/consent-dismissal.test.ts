import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  consentDismissed,
  DISMISS_KEY,
  forgetConsentDismissal,
  rememberConsentDismissal,
} from '../lib/consent/dismissal';

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

test('closing the bar is remembered, but only for the session', () => {
  const session = fakeStorage();
  const local = fakeStorage();
  Object.assign(globalThis, { sessionStorage: session, localStorage: local });
  try {
    assert.equal(consentDismissed(), false);
    rememberConsentDismissal();
    assert.equal(session.data.get(DISMISS_KEY), '1');
    assert.equal(consentDismissed(), true);
    // Dismissal must never be persisted beyond the session.
    assert.equal(local.data.size, 0);
    forgetConsentDismissal();
    assert.equal(consentDismissed(), false);
  } finally {
    Reflect.deleteProperty(globalThis, 'sessionStorage');
    Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('dismissal storage failures never throw or fake a decision', () => {
  Object.assign(globalThis, {
    sessionStorage: {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    },
  });
  try {
    assert.equal(consentDismissed(), false);
    assert.doesNotThrow(rememberConsentDismissal);
    assert.doesNotThrow(forgetConsentDismissal);
  } finally {
    Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});

test('a dismissed bar does not carry any consent of its own', () => {
  // The module stores only a flag under its own key: no category booleans, so a
  // dismissal can never be read as analytics/marketing agreement.
  assert.equal(DISMISS_KEY, 'zoppini-consent-dismissed');
});
