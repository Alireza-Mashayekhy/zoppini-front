import { useQuery } from '@tanstack/react-query';

import { categoriesList } from './api';

export const useCategoriesList = (query: { page: number; search: string }) => {
  return useQuery({
    queryKey: ['users', { ...query }],
    queryFn: () => categoriesList(query),
  });
};
