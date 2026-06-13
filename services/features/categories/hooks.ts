import { useMutation, useQuery } from '@tanstack/react-query';

import { categoriesList, createCategory } from './api';

export const useCategoriesList = (query: { page: number; search: string }) => {
  return useQuery({
    queryKey: ['users', { ...query }],
    queryFn: () => categoriesList(query),
  });
};

export function useCreateCategory() {
  return useMutation({
    mutationFn: (formData: FormData) => createCategory(formData),
  });
}
