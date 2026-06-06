import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiResponse } from '@/services/api/types';

import { LoginDto, LoginResponse, sendOtpDto, sendOtpResponse } from './types';

export async function login(dto: LoginDto) {
  const { data } = await api.post<ApiResponse<LoginResponse>>(
    endpoints.auth.login,
    dto,
  );

  return data;
}

export async function sendOtp(dto: sendOtpDto) {
  const { data } = await api.post<ApiResponse<sendOtpResponse>>(
    endpoints.auth.otp,
    dto,
  );

  return data;
}
