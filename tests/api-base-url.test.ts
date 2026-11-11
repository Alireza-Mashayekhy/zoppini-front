import assert from 'node:assert/strict';
import { test } from 'node:test';

import { normalizeApiBaseUrl } from '../services/api/base-url';

test('server API base keeps /api with or without trailing slashes', () => {
  for (const base of [
    'https://example.com/api',
    'https://example.com/api/',
    ' https://example.com/api/// ',
  ]) {
    const normalized = normalizeApiBaseUrl(base);
    assert.equal(
      `${normalized}categories?all=true`,
      'https://example.com/api/categories?all=true',
    );
    assert.equal(
      `${normalized}products?page=1`,
      'https://example.com/api/products?page=1',
    );
    assert.equal(`${normalized}seo/pages`, 'https://example.com/api/seo/pages');
    assert.equal(
      `${normalized}auth/refresh`,
      'https://example.com/api/auth/refresh',
    );
  }
});
