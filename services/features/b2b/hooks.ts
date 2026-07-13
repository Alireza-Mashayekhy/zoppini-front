// services/features/b2b/hooks.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createRequest, requestList } from './api';
import { CreateB2bDto } from './types';

export const useRequestList = (query: {
  page?: number;
  search?: string;
  all?: boolean;
}) => {
  return useQuery({
    queryKey: ['b2b-requests', query],
    queryFn: () => requestList(query),
  });
};

export const useCreateRequest = () => {
  return useMutation({
    mutationFn: (data: CreateB2bDto) => createRequest(data),
    onSuccess: () => {
      toast.success('درخواست شما با موفقیت ثبت شد');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'خطا در ثبت درخواست');
    },
  });
};
