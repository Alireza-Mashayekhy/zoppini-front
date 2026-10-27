import assert from 'node:assert/strict';
import { test } from 'node:test';

import { setConsent } from '../lib/consent/client';
import { CATEGORY_VERSION, Consent, POLICY } from '../lib/consent/policy';
import { loadSupportWidget } from '../lib/consent/support-widget';

test('RamonAI requires current preferences consent and uses one exact shop script', () => {
  const elements = new Map<string, FakeScript>();
  let created = 0;
  class FakeScript {
    id = '';
    src = '';
    async = false;
    attrs: Record<string, string> = {};
    onError?: () => void;
    setAttribute(key: string, value: string) {
      this.attrs[key] = value;
    }
    addEventListener(name: string, callback: () => void) {
      if (name === 'error') this.onError = callback;
    }
    remove() {
      elements.delete(this.id);
    }
  }
  Object.assign(globalThis, {
    window: { dispatchEvent: () => true },
    document: {
      getElementById: (id: string) => elements.get(id) || null,
      createElement: (tag: string) => {
        assert.equal(tag, 'script');
        created++;
        return new FakeScript();
      },
      body: {
        appendChild: (script: FakeScript) => elements.set(script.id, script),
      },
    },
  });
  const consent: Consent = {
    policy: POLICY,
    categories: CATEGORY_VERSION,
    at: new Date().toISOString(),
    preferences: false,
    analytics: true,
    marketing: true,
  };
  setConsent(null);
  assert.equal(loadSupportWidget(), null);
  setConsent(consent);
  assert.equal(loadSupportWidget(), null); // analytics/marketing are not support consent
  setConsent({ ...consent, preferences: true, policy: '2026-10-27.1' });
  assert.equal(loadSupportWidget(), null);
  assert.equal(created, 0);
  setConsent({ ...consent, preferences: true });
  const script = loadSupportWidget();
  assert.equal(script?.id, 'ramonai-widget');
  assert.equal(
    script?.src,
    'https://statics.ramonai.info/js/ramonai-widget.js',
  );
  assert.deepEqual(elements.get('ramonai-widget')?.attrs, {
    'data-shop-name': 'زوپینی',
  });
  assert.equal(loadSupportWidget(), script);
  assert.equal(created, 1);
  elements.get('ramonai-widget')?.onError?.();
  assert.equal(elements.size, 0); // failed load may be retried
  setConsent(null);
  assert.equal(loadSupportWidget(), null);
});
