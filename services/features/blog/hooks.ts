import { useMutation, useQuery } from '@tanstack/react-query';

import {
  adminBlogList,
  blogList,
  createBlogPost,
  deleteBlogPost,
  updateBlogPost,
} from './api';

export const useBlogList = (query: {
  page?: number;
  search?: string;
  all?: boolean;
  isFeatured?: boolean;
}) => {
  return useQuery({
    queryKey: ['blog', { ...query }],
    queryFn: () => blogList(query),
  });
};

export const useAdminBlogList = (query: {
  page?: number;
  search?: string;
  all?: boolean;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['blog', { ...query }],
    queryFn: () => adminBlogList(query),
  });
};

export function useCreateBlogPost() {
  return useMutation({
    mutationFn: (formData: FormData) => createBlogPost(formData),
  });
}

export function useUpdateBlogPost() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      updateBlogPost(id, data),
  });
}

export function useDeleteBlogPost() {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteBlogPost(id),
  });
}
