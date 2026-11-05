import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import {
  hasCareGuideContent,
  resolveCareSource,
} from '../lib/care-instructions';

const source = (path: string) =>
  readFileSync(resolve(__dirname, '..', path), 'utf8');

const guideWithSteps = {
  id: 1,
  name: 'شست‌وشوی پیراهن',
  notes: null,
  instructions: [{ id: 1, text: 'با آب سرد بشویید.', iconKey: 'wash-cold' }],
};

const html = '<p>متن قدیمی ویرایش محصول</p>';

test('راهنمای محصول با محتوا بر متن ویرایش محصول اولویت دارد', () => {
  const result = resolveCareSource(guideWithSteps, html);

  assert.equal(result.careGuide, guideWithSteps);
  assert.equal(result.careInstructionsHtml, null);
});

test('راهنمای محصول با فقط نکته هم محتوای قابل نمایش دارد', () => {
  const notesOnly = {
    ...guideWithSteps,
    instructions: [],
    notes: 'سرد بشویید',
  };

  assert.equal(hasCareGuideContent(notesOnly), true);
  assert.equal(resolveCareSource(notesOnly, html).careInstructionsHtml, null);
});

test('بدون محتوای راهنمای محصول، متن ویرایش محصول نمایش داده می‌شود', () => {
  const empty = { ...guideWithSteps, instructions: [], notes: '   ' };

  assert.equal(hasCareGuideContent(empty), false);
  assert.deepEqual(resolveCareSource(empty, html), {
    careGuide: null,
    careInstructionsHtml: html,
  });
  assert.deepEqual(resolveCareSource(null, html), {
    careGuide: null,
    careInstructionsHtml: html,
  });
  assert.deepEqual(resolveCareSource(undefined, ''), {
    careGuide: null,
    careInstructionsHtml: null,
  });
});

test('محصولی که هر دو منبع را دارد فقط راهنمای محصول را نشان می‌دهد', () => {
  const result = resolveCareSource(guideWithSteps, html);

  assert.ok(result.careGuide);
  assert.equal(result.careInstructionsHtml, null);
});

test('کامپوننت‌های نمایش از منبع نهایی استفاده می‌کنند', () => {
  const sheet = source('components/pages/product/product-guides.tsx');
  assert.match(sheet, /resolveCareSource\(\s*guides\?\.careGuide/);
  assert.match(sheet, /care\.careInstructionsHtml/);
  assert.doesNotMatch(
    sheet,
    /guides\?\.careGuide \|\| product\?\.careInstructionsHtml/,
  );
  assert.doesNotMatch(sheet, /\{product\?\.careInstructionsHtml && \(/);

  const info = source('components/pages/product/description.tsx');
  assert.match(info, /resolveCareSource\(/);
  assert.doesNotMatch(info, /\{product\.careInstructionsHtml && \(/);
});
