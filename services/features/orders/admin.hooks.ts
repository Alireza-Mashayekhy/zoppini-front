import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type AdminOrdersQuery,
  cancelAdminOrder,
  getAdminOrder,
  getAdminOrders,
  type OrderStatus,
  updateAdminOrderStatus,
} from './admin.api';

export function useAdminOrders(params: AdminOrdersQuery) {
  return useQuery({
    queryKey: ['admin-orders', params],
    queryFn: () => getAdminOrders(params),
    placeholderData: previousData => previousData,
  });
}

export function useAdminOrder(id?: number) {
  return useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => getAdminOrder(id!),
    enabled: !!id,
  });
}

export function useUpdateAdminOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      updateAdminOrderStatus(id, status),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['admin-orders'],
      });

      queryClient.invalidateQueries({
        queryKey: ['admin-order', variables.id],
      });
    },
  });
}

export function useCancelAdminOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      cancelAdminOrder(id, reason),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['admin-orders'],
      });

      queryClient.invalidateQueries({
        queryKey: ['admin-order', variables.id],
      });
    },
  });
}
