import { useQuery } from '@tanstack/react-query';

import { usersList } from './api';

export const useUsersList = (query: { page: number; search: string }) => {
  return useQuery({
    queryKey: ['users', { ...query }],
    queryFn: () => usersList(query),
  });
};
