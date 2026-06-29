import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/store/auth.store';

import { updateUser, usersList } from './api';
import { UserResponse } from './types';

export const useUsersList = (query: { page: number; search: string }) => {
  return useQuery({
    queryKey: ['users', { ...query }],
    queryFn: () => usersList(query),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserResponse> }) =>
      updateUser(id, data),
    onSuccess: updatedUser => {
      // به‌روزرسانی کش
      queryClient.setQueryData(['me'], updatedUser);
      // به‌روزرسانی store
      setUser(updatedUser);
    },
  });
};
