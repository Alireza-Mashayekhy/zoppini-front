import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createDiscount,
  deleteDiscount,
  getAdminDiscount,
  getAdminDiscounts,
  GetAdminDiscountsParams,
  updateDiscount,
} from './admin.api';
import { CreateDiscountDto, UpdateDiscountDto } from './types';

export function useAdminDiscounts(params: GetAdminDiscountsParams) {
  return useQuery({
    queryKey: ['admin-discounts', params],
    queryFn: () => getAdminDiscounts(params),
    placeholderData: previous => previous,
  });
}

export function useAdminDiscount(id?: number) {
  return useQuery({
    queryKey: ['admin-discount', id],
    queryFn: () => getAdminDiscount(id!),
    enabled: !!id,
  });
}

export function useCreateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateDiscountDto) => createDiscount(dto),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-discounts'],
      });
    },
  });
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateDiscountDto }) =>
      updateDiscount(id, dto),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['admin-discounts'],
      });

      queryClient.invalidateQueries({
        queryKey: ['admin-discount', variables.id],
      });
    },
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteDiscount(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-discounts'],
      });
    },
  });
}
