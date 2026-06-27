import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  forgotPassword,
  login,
  loginPassword,
  logout,
  resetPassword,
  sendOtp,
  signUp,
} from './api';

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

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export function useSignUp() {
  return useMutation({
    mutationFn: signUp,
  });
}
export function useLoginPassword() {
  return useMutation({
    mutationFn: loginPassword,
  });
}
export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPassword,
  });
}
export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
  });
}
