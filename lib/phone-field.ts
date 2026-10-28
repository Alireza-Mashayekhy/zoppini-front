import * as z from 'zod';

import {
  IRAN_MOBILE_REGEX,
  normalizeIranMobile,
  PHONE_ERROR_MESSAGE,
} from './phone';

/**
 * فیلد مشترک «شماره موبایل» برای همه‌ی فرم‌های احراز هویت
 * (ورود با کد، ورود با رمز، ثبت‌نام، فراموشی رمز).
 *
 * مقدار خروجی نرمال‌شده است (`09xxxxxxxxx`)، بنابراین همان چیزی که اعتبارسنجی
 * می‌شود دقیقاً همان چیزی است که به سرور می‌رود.
 */
export const phoneField = z
  .string({ error: 'شماره موبایل الزامی است' })
  .trim()
  .transform(normalizeIranMobile)
  .refine(value => IRAN_MOBILE_REGEX.test(value), {
    message: PHONE_ERROR_MESSAGE,
  });
