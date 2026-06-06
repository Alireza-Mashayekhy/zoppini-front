import { useMutation } from '@tanstack/react-query';

import { login, sendOtp } from './api';

export function useLogin() {
  return useMutation({
    mutationFn: login,
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: sendOtp,
  });
}
