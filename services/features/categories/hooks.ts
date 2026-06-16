import { useMutation, useQuery } from '@tanstack/react-query';

import { categoriesList, createCategory, updateCategory } from './api';

export const useCategoriesList = (query: {
  page?: number;
  search?: string;
  all: boolean;
}) => {
  return useQuery({
    queryKey: ['categories', { ...query }],
    queryFn: () => categoriesList(query),
  });
};

export function useCreateCategory() {
  return useMutation({
    mutationFn: (formData: FormData) => createCategory(formData),
  });
}

export function useUpdateCategory() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      updateCategory(id, data),
  });
}
