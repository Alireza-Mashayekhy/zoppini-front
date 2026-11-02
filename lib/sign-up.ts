import * as z from 'zod';

import { phoneField } from '@/lib/phone-field';
import { persianDateToISO } from '@/lib/utils';
import { SignUpDto } from '@/services/features/auth/types';

/**
 * فیلدهای «اطلاعات ثبتنام» یکبار اینجا تعریف میشوند تا صفحهی `/sign-up`
 * و مرحلهی ثبتنام داخل `/login` دقیقاً یک اعتبارسنجی و یک payload داشته باشند.
 */
export const signUpDetailsSchema = z.object({
  fullName: z.string().min(3, 'نام کامل حداقل ۳ کاراکتر است'),
  phone: phoneField,
  email: z.string().email('ایمیل نامعتبر است').optional().or(z.literal('')),
  password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر است'),
  birthDate: z.string().optional(),
});

export type SignUpFormData = z.infer<typeof signUpDetailsSchema>;

/**
 * شمای مخصوص مرحلهی ثبتنام داخل لاگین: شماره قبلاً گرفته و تأیید شده،
 * بنابراین نباید دوباره قابل ویرایش باشد (امکان ثبت شمارهای غیر از شمارهی
 * تأییدشده را نمیدهد).
 */
export const loginSignUpDetailsSchema = signUpDetailsSchema.omit({
  phone: true,
});

export type LoginSignUpDetails = z.infer<typeof loginSignUpDetailsSchema>;

export function buildSignUpPayload(
  details: LoginSignUpDetails | SignUpFormData,
  phone: string,
  code: string,
): SignUpDto {
  const email = details.email?.trim();

  return {
    fullName: details.fullName.trim(),
    phone,
    ...(email ? { email } : {}),
    code,
    password: details.password,
    birthDate: persianDateToISO(details.birthDate || ''),
  };
}
