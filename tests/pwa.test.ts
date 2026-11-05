import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

import manifest from '../app/manifest';
import {
  detectPlatform,
  isSafePromotionPath,
  isStandalone,
} from '../lib/pwa/platform';

const safari =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1';
test('platforms and standalone detection', () => {
  assert.equal(detectPlatform(safari, 'iPhone', 5), 'ios-safari');
  assert.equal(
    detectPlatform(safari.replace('Version/17.0', 'CriOS/120.0'), 'iPhone', 5),
    'ios-chrome',
  );
  assert.equal(
    detectPlatform(safari.replace('Version/17.0', 'FxiOS/120.0'), 'iPhone', 5),
    'ios-other',
  );
  assert.equal(
    detectPlatform(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/17.0 Safari/605.1',
      'MacIntel',
      5,
    ),
    'ios-safari',
  );
  assert.equal(
    detectPlatform(
      'Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile Safari/537',
      'Linux',
      5,
    ),
    'android',
  );
  assert.equal(
    detectPlatform(
      'Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537',
      'Win32',
      0,
    ),
    'desktop',
  );
  assert.equal(
    detectPlatform(
      'Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537 Edg/120',
      'Win32',
      0,
    ),
    'desktop',
  );
  assert.equal(
    detectPlatform(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120 Safari/537',
      'MacIntel',
      0,
    ),
    'desktop',
  );
  assert.equal(
    detectPlatform(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X) Version/17.0 Safari/605',
      'MacIntel',
      0,
    ),
    'mac-safari',
  );
  assert.equal(
    detectPlatform(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X) Version/16.0 Safari/605',
      'MacIntel',
      0,
    ),
    'other',
  );
  const win = {
    matchMedia: (query: string) => ({ matches: query.includes('standalone') }),
  } as Window;
  assert.equal(isStandalone(win, {} as Navigator), true);
  assert.equal(
    isStandalone(
      { matchMedia: () => ({ matches: false }) } as unknown as Window,
      { standalone: true } as unknown as Navigator,
    ),
    true,
  );
  for (const path of [
    '/checkout',
    '/checkout/payment',
    '/dashboard/orders',
    '/login-with-pass',
    '/forgot-pass',
    '/sign-up',
    '/cart',
  ])
    assert.equal(isSafePromotionPath(path), false, path);
  assert.equal(isSafePromotionPath('/products'), true);
});

test('manifest icon files have the promised dimensions', () => {
  const data = manifest();
  assert.equal(data.display, 'standalone');
  assert.equal(data.scope, '/');
  for (const [path, size] of [
    ['public/pwa/icon-192.png', 192],
    ['public/pwa/icon-512.png', 512],
    ['public/pwa/icon-maskable-512.png', 512],
    ['public/pwa/apple-touch-icon.png', 180],
  ] as const) {
    const image = readFileSync(path);
    assert.equal(image.readUInt32BE(16), size, path);
    assert.equal(image.readUInt32BE(20), size, path);
  }
  assert.ok(data.icons?.some(icon => icon.purpose === 'maskable'));
});

test('service worker caches only offline assets, skips sensitive traffic and falls back for public navigations', async () => {
  const handlers: Record<string, (event: any) => void> = {};
  const stored: string[] = [];
  const deleted: string[] = [];
  let offline = false;
  const context = {
    URL,
    self: {
      location: { origin: 'https://zoppinico.com' },
      addEventListener: (name: string, fn: (event: any) => void) => {
        handlers[name] = fn;
      },
      skipWaiting: async () => {},
      clients: { claim: async () => {} },
    },
    caches: {
      open: async () => ({
        addAll: async (assets: string[]) => {
          stored.push(...assets);
        },
      }),
      keys: async () => ['zoppini-offline-v0', 'unrelated-cache'],
      delete: async (key: string) => {
        deleted.push(key);
      },
      match: async () => 'offline-response',
    },
    fetch: async () => {
      if (offline) throw new Error('offline');
      return 'network-response';
    },
  };
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), context);
  let pending: Promise<unknown> = Promise.resolve();
  handlers.install({
    waitUntil: (value: Promise<unknown>) => {
      pending = value;
    },
  });
  await pending;
  assert.ok(stored.includes('/offline.html'));
  assert.ok(
    stored.every(
      asset => asset === '/offline.html' || asset.startsWith('/pwa/'),
    ),
  );
  handlers.activate({
    waitUntil: (value: Promise<unknown>) => {
      pending = value;
    },
  });
  await pending;
  assert.deepEqual(deleted, ['zoppini-offline-v0']);
  const request = (path: string, mode = 'navigate', method = 'GET') => {
    let response: Promise<unknown> | undefined;
    handlers.fetch({
      request: { url: `https://zoppinico.com${path}`, mode, method },
      respondWith: (value: Promise<unknown>) => {
        response = value;
      },
    });
    return response;
  };
  for (const path of [
    '/api/products',
    '/checkout/payment',
    '/dashboard/orders',
    '/login',
    '/login-with-pass',
    '/forgot-pass',
    '/sign-up',
    '/privacy/state',
    '/_next/data/x',
  ])
    assert.equal(request(path), undefined, path);
  assert.equal(request('/products', 'navigate', 'POST'), undefined);
  assert.equal(request('/products', 'cors'), undefined);
  assert.equal(await request('/products'), 'network-response');
  offline = true;
  assert.equal(await request('/products'), 'offline-response');
});
