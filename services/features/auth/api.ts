import { normalizeIranMobile } from '@/lib/phone';
import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiSingleResponse } from '@/services/api/types';

import {
  ForgetPasswordDto,
  LoginDto,
  LoginResponse,
  LoginWithPasswordDto,
  ResetPasswordDto,
  sendOtpDto,
  sendOtpResponse,
  SignUpDto,
} from './types';

/**
 * همیشه شماره را یکدست می‌فرستیم (`09xxxxxxxxx`)، حتی اگر کاربر اعداد فارسی،
 * فاصله یا پیش‌شماره +۹۸ وارد کرده باشد.
 */
function withNormalizedPhone<T extends { phone: string }>(dto: T): T {
  return { ...dto, phone: normalizeIranMobile(dto.phone) };
}

export async function login(dto: LoginDto) {
  const { data } = await api.post<ApiSingleResponse<LoginResponse>>(
    endpoints.auth.login,
    withNormalizedPhone(dto),
  );

  return data;
}

export async function sendOtp(dto: sendOtpDto) {
  const { data } = await api.post<ApiSingleResponse<sendOtpResponse>>(
    endpoints.auth.otp,
    withNormalizedPhone(dto),
  );

  return data;
}

export async function logout() {
  const { data } = await api.post(endpoints.auth.logout);
  return data;
}

export async function signUp(formData: SignUpDto) {
  const { data } = await api.post(
    endpoints.auth.signUp,
    withNormalizedPhone(formData),
  );
  return data;
}

export async function loginPassword(formData: LoginWithPasswordDto) {
  const { data } = await api.post(
    endpoints.auth.loginPassword,
    withNormalizedPhone(formData),
  );
  return data;
}

export async function forgotPassword(formData: ForgetPasswordDto) {
  const { data } = await api.post(
    endpoints.auth.forgotPassword,
    withNormalizedPhone(formData),
  );
  return data;
}

export async function resetPassword(formData: ResetPasswordDto) {
  const { data } = await api.post(
    endpoints.auth.resetPassword,
    withNormalizedPhone(formData),
  );
  return data;
}

export async function fetchMe() {
  const { data } = await api.get(endpoints.auth.me);
  return data;
}
