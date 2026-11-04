import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initializeGoogleAnalytics, sendGooglePageView } from '../lib/google-analytics';
import { cleanOptionalStorage, setConsent } from '../lib/consent/client';

test('Google Analytics runs without consent and is initialized only once', () => {
  const scripts: { id: string; src: string; async: boolean }[] = [];
  const w = { dataLayer: [] as unknown[], dispatchEvent: () => true };
  const cookieWrites: string[] = [];
  const doc = {
    referrer: 'https://example.test/path?private=secret',
    get cookie() { return '_ga=123; sidebar_state=1'; },
    set cookie(value: string) { cookieWrites.push(value); },
    getElementById: (id: string) => scripts.find(script => script.id === id),
    createElement: () => ({ id: '', src: '', async: false }),
    head: { appendChild: (script: typeof scripts[number]) => scripts.push(script) },
  };
  Object.assign(globalThis, {
    window: w, document: doc, location: { origin: 'https://shop.test', hostname: 'shop.test' },
    sessionStorage: {}, localStorage: {},
  });
  setConsent(null);
  initializeGoogleAnalytics();
  initializeGoogleAnalytics();
  sendGooglePageView();
  cleanOptionalStorage();
  assert.equal(scripts.length, 1);
  assert.match(scripts[0].src, /G-9X59F9BJFQ/);
  const calls = w.dataLayer as unknown[][];
  assert.equal(calls.filter(call => call[0] === 'config').length, 1);
  const page = calls.find(call => call[0] === 'event')!;
  assert.equal(page[1], 'page_view');
  assert.deepEqual(page[2], { send_to: 'G-9X59F9BJFQ', page_location: 'https://shop.test/', page_referrer: 'example.test', page_title: '' });
  assert.equal(cookieWrites.some(value => value.startsWith('_ga=')), false);
  assert.equal(cookieWrites.some(value => value.startsWith('sidebar_state=')), true);
});
