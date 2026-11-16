import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import CheckoutWizardShell, {
  CHECKOUT_WIZARD_STEPS,
} from '../components/pages/checkout/checkout-wizard';

const source = (path: string) =>
  readFileSync(resolve(__dirname, '..', path), 'utf8');

const formSrc = source('components/pages/checkout/checkout-form.tsx');
const wizardSrc = source('components/pages/checkout/checkout-wizard.tsx');
const summarySrc = source('components/pages/checkout/order-summary.tsx');

const renderWizard = (
  overrides: Partial<Parameters<typeof CheckoutWizardShell>[0]> = {},
) =>
  renderToStaticMarkup(
    createElement(CheckoutWizardShell, {
      step: 0,
      onStepChange: () => {},
      validateStep: () => true,
      stepsContent: [
        createElement('div', { 'data-step': 'cart' }, 'محتوای سبد'),
        createElement('div', { 'data-step': 'delivery' }, 'محتوای ارسال'),
        createElement('div', { 'data-step': 'payment' }, 'محتوای پرداخت'),
      ],
      hasCartItems: true,
      submitting: false,
      canSubmit: true,
      submitLabel: 'ثبت سفارش و پرداخت',
      ...overrides,
    }),
  );

test('سه مرحله با عنوان‌های درست و dir=rtl رندر می‌شوند', () => {
  const html = renderWizard();
  assert.match(html, /dir="rtl"/);
  for (const label of CHECKOUT_WIZARD_STEPS) {
    assert.ok(html.includes(label), `missing step label: ${label}`);
  }
  assert.match(html, /aria-label="مراحل تکمیل سفارش"/);
  assert.match(html, /aria-current="step"/);
});

test('فقط محتوای مرحلهٔ فعلی نمایش داده می‌شود و بقیه mount اما مخفی‌اند', () => {
  const html = renderWizard({ step: 0 });
  // هر سه پنل در DOM هستند (state حفظ شود)، اما ۲ پنل آخر hidden
  assert.ok(html.includes('محتوای سبد'));
  assert.ok(html.includes('محتوای ارسال'));
  assert.ok(html.includes('محتوای پرداخت'));
  const hiddenCount = (html.match(/class="hidden"/g) || []).length;
  assert.equal(hiddenCount, 2);
});

test('مرحلهٔ فعلی با دکمه‌های قبل/بعد و وضعیت‌های درست پیمایش می‌شود', () => {
  const html = renderWizard({ step: 0 });
  // مرحلهٔ اول: «مرحله قبل» غیرفعال
  const prev = html.lastIndexOf('مرحله قبل');
  assert.match(html.slice(0, prev), /disabled/);
  // مرحلهٔ آخر: دکمهٔ نهایی ثبت با type=submit
  const last = renderWizard({ step: 2 });
  assert.match(last, /type="submit"/);
  assert.match(last, /ثبت سفارش و پرداخت/);
  assert.doesNotMatch(last, /مرحله بعد/);
});

test('دکمهٔ «مرحله بعد» در صورت خالی بودن سبد غیرفعال است', () => {
  const html = renderWizard({ step: 0, hasCartItems: false });
  const nextIdx = html.indexOf('مرحله بعد');
  const btnChunk = html.slice(lastButtonStart(html, nextIdx), nextIdx);
  assert.match(btnChunk, /disabled/);
});

function lastButtonStart(html: string, before: number) {
  return html.lastIndexOf('<button', before);
}

test('دسکتاپ همان چیدمان قبلی را دارد و ویزارد فقط زیر lg است', () => {
  // چیدمان دسکتاپ: نامرئی زیر lg، و محتوای ویزارد نامرئی بالای lg
  assert.match(formSrc, /hidden lg:grid lg:grid-cols-3 gap-8/);
  assert.match(formSrc, /<div className="lg:hidden">/);
  // بخش‌ها فقط یک‌بار تعریف می‌شوند و در هر دو چیدمان مصرف می‌شوند
  const deliveries = (formSrc.match(/\{deliveryContent\}/g) || []).length;
  assert.equal(deliveries, 2);
  const payments = (formSrc.match(/\{paymentContent\}/g) || []).length;
  assert.equal(payments, 2);
});

test('مرز اعتبارسنجی مرحلهٔ ارسال پیام‌های فارسی فعلی را دارد', () => {
  assert.match(formSrc, /validateWizardStep/);
  assert.match(formSrc, /isPickup\) return true/);
  assert.match(formSrc, /لطفاً آدرس تحویل را انتخاب کنید/);
  assert.match(formSrc, /روش ارسال برای آدرس انتخاب‌شده در دسترس نیست/);
});

test('خطای اعتبارسنجی فرم کاربر را به مرحلهٔ مرتبط برمی‌گرداند', () => {
  assert.match(formSrc, /onInvalidSubmit/);
  assert.match(formSrc, /handleSubmit\(onSubmit, onInvalidSubmit\)/);
  // خطاهای مربوط به آدرس/روش ارسال → بازگشت به مرحلهٔ ارسال
  assert.match(formSrc, /goToWizardStep\(1\)/);
});

test('پیمایش مراحل آینده از طریق شاخص ممنوع است؛ برگشت آزاد است', () => {
  assert.match(wizardSrc, /disabled=\{index > step\}/);
  assert.match(wizardSrc, /index < step && onStepChange\(index\)/);
});

test('لیست اقلام و مبالغ مشترک دسکتاپ/موبایل از order-summary استخراج شده‌اند', () => {
  assert.match(summarySrc, /export function CheckoutItemsList/);
  assert.match(summarySrc, /export function CheckoutTotals/);
  // OrderSummary دسکتاپ همچنان از همان اجزا استفاده می‌کند (تکرار نشده‌اند)
  assert.match(summarySrc, /<CheckoutItemsList/);
  assert.match(summarySrc, /<CheckoutTotals/);
});
