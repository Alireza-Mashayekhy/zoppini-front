import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  adminPageSeoList,
  createPageSeo,
  deletePageSeo,
  updatePageSeo,
} from './api';
import { CreatePageSeoDto, UpdatePageSeoDto } from './types';

export const SEO_PAGES_QUERY_KEY = 'seo-pages';

/** لیست صفحات سئو در پنل مدیریت */
export const useAdminPageSeoList = (query: {
  page?: number;
  limit?: number;
  search?: string;
  all?: boolean;
}) => {
  return useQuery({
    queryKey: [SEO_PAGES_QUERY_KEY, { ...query }],
    queryFn: () => adminPageSeoList(query),
  });
};

export function useCreatePageSeo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePageSeoDto) => createPageSeo(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SEO_PAGES_QUERY_KEY] });
    },
  });
}

export function useUpdatePageSeo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdatePageSeoDto }) =>
      updatePageSeo(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SEO_PAGES_QUERY_KEY] });
    },
  });
}

export function useDeletePageSeo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deletePageSeo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SEO_PAGES_QUERY_KEY] });
    },
  });
}
