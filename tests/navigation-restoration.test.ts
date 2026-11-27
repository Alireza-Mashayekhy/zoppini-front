import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  captureProductNavigation,
  clearPendingListingSnapshot,
  getPendingListingState,
  isListingReady,
  markListingReady,
  prepareListingRestoration,
  registerListingSnapshot,
} from '../lib/navigation/restoration';

test('product return is keyed to its history entry, full URL and source product', () => {
  const originals = Object.fromEntries(
    ['window', 'document', 'sessionStorage', 'Element', 'getComputedStyle'].map(
      key => [key, Object.getOwnPropertyDescriptor(globalThis, key)],
    ),
  );
  class ElementMock {
    parentElement = null;
    tagName = 'A';
    target = '';
    href = 'https://shop.example/product/shirt';
    closest() {
      return this;
    }
    hasAttribute() {
      return false;
    }
    getBoundingClientRect() {
      return { top: 145 };
    }
  }
  const link = new ElementMock();
  const store = new Map<string, string>();
  const storage = new Proxy(
    {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
    {
      ownKeys: () => [...store.keys()],
      getOwnPropertyDescriptor: () => ({
        enumerable: true,
        configurable: true,
      }),
    },
  );
  const location = {
    href: 'https://shop.example/products?search=shirt#results',
    origin: 'https://shop.example',
    pathname: '/products',
    search: '?search=shirt',
    hash: '#results',
  };
  const history = {
    state: { next: 'preserved' } as Record<string, unknown>,
    replaceState(state: Record<string, unknown>) {
      this.state = state;
    },
  };
  Object.assign(globalThis, {
    Element: ElementMock,
    getComputedStyle: () => ({}),
    sessionStorage: storage,
    window: { location, history, scrollY: 850, dispatchEvent: () => true },
    document: { querySelectorAll: () => [link], body: {}, documentElement: {} },
  });
  const unregister = registerListingSnapshot('product-list', () => ({
    page: 4,
    sort: 'price:asc',
  }));
  try {
    captureProductNavigation({
      button: 0,
      target: link,
    } as unknown as MouseEvent);
    assert.equal(history.state.next, 'preserved');
    const entry = { ...history.state };
    assert.ok(prepareListingRestoration(entry, '/product/shirt'));
    assert.deepEqual(getPendingListingState('product-list'), {
      page: 4,
      sort: 'price:asc',
    });
    assert.equal(
      isListingReady(prepareListingRestoration(entry, '/product/shirt')!),
      false,
    );
    markListingReady('product-list');
    assert.equal(
      isListingReady(prepareListingRestoration(entry, '/product/shirt')!),
      false,
      'a new traversal clears readiness',
    );
    assert.equal(prepareListingRestoration(entry, '/product/other'), null);
    location.search = '?search=other';
    assert.equal(prepareListingRestoration(entry, '/product/shirt'), null);
    location.search = '?search=shirt';
    location.hash = '';
    assert.equal(prepareListingRestoration(entry, '/product/shirt'), null);
    assert.equal(prepareListingRestoration({}, '/product/shirt'), null);
  } finally {
    unregister();
    clearPendingListingSnapshot();
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
