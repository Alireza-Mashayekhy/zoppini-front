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

export async function login(dto: LoginDto) {
  const { data } = await api.post<ApiSingleResponse<LoginResponse>>(
    endpoints.auth.login,
    dto,
  );

  return data;
}

export async function sendOtp(dto: sendOtpDto) {
  const { data } = await api.post<ApiSingleResponse<sendOtpResponse>>(
    endpoints.auth.otp,
    dto,
  );

  return data;
}

export async function logout() {
  const { data } = await api.post(endpoints.auth.logout);
  return data;
}

export async function signUp(formData: SignUpDto) {
  const { data } = await api.post(endpoints.auth.signUp, formData);
  return data;
}

export async function loginPassword(formData: LoginWithPasswordDto) {
  const { data } = await api.post(endpoints.auth.loginPassword, formData);
  return data;
}

export async function forgotPassword(formData: ForgetPasswordDto) {
  const { data } = await api.post(endpoints.auth.forgotPassword, formData);
  return data;
}

export async function resetPassword(formData: ResetPasswordDto) {
  const { data } = await api.post(endpoints.auth.resetPassword, formData);
  return data;
}
