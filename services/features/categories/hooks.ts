import { useMutation, useQuery } from '@tanstack/react-query';

import {
  adminCategoriesList,
  categoriesList,
  createCategory,
  deleteCategory,
  updateCategory,
} from './api';

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

export const useAdminCategoriesList = (query: {
  page?: number;
  search?: string;
  all: boolean;
}) => {
  return useQuery({
    queryKey: ['categories', { ...query }],
    queryFn: () => adminCategoriesList(query),
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

export function useDeleteCategory() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteCategory(id),
  });
}
