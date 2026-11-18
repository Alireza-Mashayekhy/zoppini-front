import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import Footer from '../components/layout/public/footer';

test('mobile trust seal is centered alongside the guide and desktop seal is unchanged', () => {
  const html = renderToStaticMarkup(createElement(Footer));
  assert.match(html, /class="footer-help-wrap flex w-full gap-4 sm:contents"/);
  assert.match(
    html,
    /class="footer-enamad footer-enamad--inline flex min-w-0 flex-1 items-center justify-center sm:hidden"/,
  );
  assert.match(html, /width="160" height="160"[^>]*class="h-auto max-w-full"/);
  assert.match(html, /class="footer-enamad footer-enamad--trust hidden sm:block"/);
  assert.match(html, /width="55" height="55"/);
  assert.equal((html.match(/trustseal\.enamad\.ir/g) ?? []).length, 2);
});
