import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createCatalogPage,
  deleteCatalogPage,
  getCatalogPages,
  updateCatalogPage,
} from './api';

export function useAdminCatalogPages() {
  return useQuery({
    queryKey: ['catalog-pages'],
    queryFn: getCatalogPages,
  });
}

export function useCreateCatalogPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => createCatalogPage(formData),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['catalog-pages'],
      });
    },
  });
}

export function useUpdateCatalogPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updateCatalogPage(id, formData),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['catalog-pages'],
      });
    },
  });
}

export function useDeleteCatalogPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCatalogPage(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['catalog-pages'],
      });
    },
  });
}
