import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import {
  isAlreadySentError,
  isOtpExpiredError,
  OTP_TTL_SECONDS,
  otpErrorMessage,
  readOtpWindow,
} from '../lib/otp-window';
import {
  buildSignUpPayload,
  loginSignUpDetailsSchema,
  signUpDetailsSchema,
} from '../lib/sign-up';

test('تایمر فرانت دقیقاً از expiresIn سرور میخورد (کد == ارسال مجدد)', () => {
  const first = readOtpWindow({
    status: 200,
    message: 'کد تایید ارسال شد',
    data: { sent: true, alreadySent: false, expiresIn: 120 },
  });
  assert.deepEqual(first, { sent: true, alreadySent: false, expiresIn: 120 });

  // درخواست مجدد زودهنگام: پیامک نرفته، ولی ۷۵ ثانیهی واقعی کد باقی است
  const again = readOtpWindow({
    status: 200,
    message: 'کد قبلا برای شما ارسال شده است',
    data: { sent: false, alreadySent: true, expiresIn: 75 },
  });
  assert.equal(again.sent, false);
  assert.equal(again.alreadySent, true);
  assert.equal(again.expiresIn, 75);
  assert.equal(again.expiresIn, 120 - 45);

  // بکاند قدیمی که فیلدها را نمیدهد → fallback همان TTL بکاند است
  assert.equal(readOtpWindow({}).expiresIn, OTP_TTL_SECONDS);
  assert.equal(readOtpWindow(null).expiresIn, OTP_TTL_SECONDS);
  assert.equal(
    readOtpWindow({ data: { expiresIn: -1 } }).expiresIn,
    OTP_TTL_SECONDS,
  );
});

test('ثابت TTL فرانت و بکاند برابرند', () => {
  const backend = readFileSync(
    resolve(__dirname, '../../back/src/otp/otp.service.ts'),
    'utf8',
  );
  const [, seconds] = backend.match(/private readonly OTP_TTL\s*=\s*(\d+)/) ?? [];
  assert.equal(Number(seconds), OTP_TTL_SECONDS);
  // بکاند دیگر cooldown جداگانه (۶۰ ثانیه) ندارد
  assert.doesNotMatch(backend, /SEND_COOLDOWN/);
});

test('خطاهای قدیمی «صبر کنید / کد قبلی معتبر است» رفتن به مرحله کد را متوقف نمیکنند', () => {
  for (const message of [
    'لطفاً قبل از درخواست مجدد کمی صبر کنید',
    'کد قبلی هنوز معتبر است',
    'کد قبلا برای شما ارسال شده است',
  ]) {
    assert.equal(
      isAlreadySentError({ response: { data: { message } } }),
      true,
      message,
    );
  }
  assert.equal(
    isAlreadySentError({ response: { data: { message: 'شماره موبایل معتبر نیست' } } }),
    false,
  );
});

test('کد منقضی/پایان تلاشها قابل تشخیص است تا کاربر کد تازه بگیرد', () => {
  assert.equal(
    isOtpExpiredError({ response: { data: { message: 'کد منقضی شده است' } } }),
    true,
  );
  assert.equal(
    isOtpExpiredError({
      response: { data: { message: 'تعداد تلاش‌های مجاز تمام شده است' } },
    }),
    true,
  );
  assert.equal(
    isOtpExpiredError({ response: { data: { message: 'کد وارد شده اشتباه است' } } }),
    false,
  );
  assert.equal(
    otpErrorMessage({ response: { data: { message: ['خطای ۱', 'خطای ۲'] } } }),
    'خطای ۱ خطای ۲',
  );
  assert.equal(otpErrorMessage(new Error(''), 'پیشفرض'), 'پیشفرض');
});

test('ایمیل اختیاری: مقدار خالی ارسال نمیشود، مقدار معتبر trim میشود', () => {
  const details = {
    fullName: '  علی تست  ',
    email: '',
    password: 'secret123',
    birthDate: '',
  };

  const withoutEmail = buildSignUpPayload(details, '09918690340', '12345');
  assert.equal('email' in withoutEmail, false);
  assert.equal(withoutEmail.fullName, 'علی تست');
  assert.equal(withoutEmail.birthDate, '');
  assert.equal(withoutEmail.code, '12345');

  const withEmail = buildSignUpPayload(
    { ...details, email: '  user@example.com ' },
    '09918690340',
    '12345',
  );
  assert.equal(withEmail.email, 'user@example.com');
});

test('اعتبارسنجی دو فرم ثبتنام یکسان است و مرحله لاگین شماره را تغییر نمیدهد', () => {
  const valid = {
    fullName: 'علی تست',
    phone: '09918690340',
    email: '',
    password: 'secret123',
    birthDate: '',
  };
  assert.equal(signUpDetailsSchema.safeParse(valid).success, true);
  assert.equal(signUpDetailsSchema.safeParse({ ...valid, email: undefined }).success, true);
  assert.equal(signUpDetailsSchema.safeParse({ ...valid, email: 'bad' }).success, false);

  // شماره در مرحلهی ثبتنام داخل لاگین وجود ندارد → امکان ثبت شمارهی تأییدنشده نیست
  const parsed = loginSignUpDetailsSchema.parse(valid);
  assert.equal('phone' in parsed, false);
  assert.equal(loginSignUpDetailsSchema.safeParse({ ...valid, email: '' }).success, true);
});
