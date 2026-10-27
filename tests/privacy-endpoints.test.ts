import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PRIVACY_BASE_PATH,
  PrivacyAction,
  privacyUrl,
} from '../lib/consent/endpoints';

// Regression: the production reverse proxy forwards /api/* to Nest. If a
// browser-facing consent URL ever moves back under /api, the minimal CMP
// payload is validated by ConsentDto and returns 400 ("id must be a UUID",
// "policy must be one of the following values: ...", ...).
test('browser consent endpoints never use the backend-owned /api prefix', () => {
  assert.equal(PRIVACY_BASE_PATH.startsWith('/api'), false);
  for (const action of ['state', 'consent', 'context', 'event'] as PrivacyAction[]) {
    const url = privacyUrl(action);
    assert.equal(url, `${PRIVACY_BASE_PATH}/${action}`);
    assert.equal(url.startsWith('/api/'), false);
  }
});
