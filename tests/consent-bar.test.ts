import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import ConsentBar, {
  CONSENT_DESCRIPTION,
  CONSENT_TITLE,
  ConsentBarProps,
} from '../components/consent/bar';
// Effects do not run during server rendering, so the measured CSS variable and
// ResizeObserver never touch a DOM here.

const base: ConsentBarProps = {
  pending: null,
  error: '',
  onAcceptAll: () => {},
  onAcceptNecessary: () => {},
  onClose: () => {},
};

const render = (over: Partial<ConsentBarProps> = {}) =>
  renderToStaticMarkup(createElement(ConsentBar, { ...base, ...over }));

test('the bar uses the approved Persian copy verbatim', () => {
  const html = render();
  assert.match(html, new RegExp(CONSENT_TITLE));
  assert.match(html, new RegExp(CONSENT_DESCRIPTION));
  assert.equal(
    CONSENT_TITLE,
    'برای تجربه بهتر خرید در زوپینی',
  );
  assert.equal(
    CONSENT_DESCRIPTION,
    'برای اینکه سایت زوپینی بهتر کار کنه و تجربه خرید راحت‌تری داشته باشید، از کوکی‌ها استفاده می‌کنیم. کوکی‌ها فایل‌های کوچیکی هستن که به سایت کمک می‌کنن امکاناتی مثل ورود به حساب کاربری و سبد خرید درست کار کنن. گوگل آنالیتیکس برای آمار بازدید بدون نیاز به انتخاب شما فعال است. سایر ابزارهای آماری و تبلیغاتی به انتخاب شما بستگی دارند.',
  );
});

test('the bar is a fixed, right-to-left bottom notification', () => {
  const html = render();
  assert.match(html, /dir="rtl"/);
  assert.match(html, /class="fixed inset-x-0 bottom-0 z-\[60\]/);
  assert.match(html, /aria-label="رضایت کوکی‌ها"/);
  // Reasonable maximum content width instead of an edge-to-edge text block.
  assert.match(html, /max-w-6xl/);
  // Right-aligned, readable body copy.
  assert.match(html, /text-right/);
});

test('exactly two consent actions remain and the old controls are gone', () => {
  const html = render();
  assert.equal(html.split('پذیرش همه').length - 1, 1);
  assert.equal(html.split('رد سایر کوکی‌های اختیاری').length - 1, 1);

  // Removed by request: temporary close label, settings entry point, category
  // switches and the oversized modal chrome.
  for (const removed of [
    'بستن موقت',
    'تنظیمات کوکی‌ها',
    'مدیریت ترجیحات',
    'ذخیره‌ی انتخاب من',
    'ترجیحات',
    'بازاریابی',
  ]) {
    assert.equal(html.includes(removed), false, `unexpected: ${removed}`);
  }

  // Only the close (X) button, and it is labelled as not being a choice.
  const closeButtons = html.match(/aria-label="بستن بنر کوکی‌ها بدون ثبت انتخاب"/g);
  assert.equal(closeButtons?.length, 1);
  // Buttons: close, mobile expand toggle, and the two consent actions.
  assert.equal((html.match(/<button/g) || []).length, 4);
  assert.match(html, /aria-expanded="false"/);
});

test('both actions are disabled while a choice is being saved', () => {
  assert.equal(render().match(/disabled=""/g), null);
  for (const pending of ['all', 'reject'] as const) {
    const html = render({ pending });
    // React renders the disabled attribute as disabled="".
    assert.equal(html.match(/disabled=""/g)?.length, 2);
  }
});

test('a failed save is surfaced without closing the bar', () => {
  assert.equal(render().includes('role="alert"'), false);
  const html = render({ error: 'انتخاب ذخیره نشد. ردیابی متوقف است؛ دوباره تلاش کنید.' });
  assert.match(html, /role="alert"/);
  assert.match(html, /انتخاب ذخیره نشد/);
  assert.match(html, /پذیرش همه/);
});
