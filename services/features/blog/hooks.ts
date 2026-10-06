import { useMutation, useQuery } from '@tanstack/react-query';

import {
  adminBlogBlocks,
  adminBlogList,
  blogList,
  createBlogPost,
  deleteBlogPost,
  saveBlogBlocks,
  updateBlogPost,
  uploadBlogMedia,
} from './api';
import { BlogBlock } from './types';

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

// ───────────────────────── بخش‌های مقاله (بلوک‌ها) ─────────────────────────

/** بخش‌های یک مقاله برای ویرایش در پنل ادمین */
export const useAdminBlogBlocks = (id?: number, enabled = true) => {
  return useQuery({
    queryKey: ['blog-blocks', id],
    queryFn: () => adminBlogBlocks(id as number),
    enabled: !!id && enabled,
  });
};

export function useSaveBlogBlocks() {
  return useMutation({
    mutationFn: ({ id, blocks }: { id: number; blocks: BlogBlock[] }) =>
      saveBlogBlocks(id, blocks),
  });
}

/**
 * آپلود عکس/فیلم از سیستم ادمین برای استفاده در مقاله
 * (گالری مدیا، ادیتور متن و پوستر ویدیو)
 */
export function useUploadBlogMedia() {
  return useMutation({
    mutationFn: ({
      file,
      kind,
      onProgress,
    }: {
      file: File;
      kind: 'image' | 'video';
      onProgress?: (percent: number) => void;
    }) => uploadBlogMedia(file, kind, onProgress),
  });
}
