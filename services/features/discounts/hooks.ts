// services/features/discount/hooks.ts

import { useMutation } from '@tanstack/react-query';

import { applyDiscount } from './api';

export function useApplyDiscount() {
  return useMutation({
    mutationFn: applyDiscount,
  });
}
