import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { BlogBlock, BlogPostResponse } from './types';

export async function blogList(query: {
  page?: number;
  search?: string;
  all?: boolean;
  isFeatured?: boolean;
}) {
  const { data } = await api.get<ApiListResponse<BlogPostResponse>>(
    endpoints.blog.list,
    { params: query },
  );

  return data;
}

export async function adminBlogList(query: {
  page?: number;
  search?: string;
  all?: boolean;
}) {
  const { data } = await api.get<ApiListResponse<BlogPostResponse>>(
    endpoints.blog.adminList,
    { params: query },
  );

  return data;
}

export async function createBlogPost(formData: FormData) {
  const { data } = await api.post<ApiSingleResponse<BlogPostResponse>>(
    endpoints.blog.create,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return data;
}

export async function updateBlogPost(id: number, formData: FormData) {
  const { data } = await api.patch<ApiSingleResponse<BlogPostResponse>>(
    endpoints.blog.update(id),
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return data;
}

export async function deleteBlogPost(id: number) {
  const { data } = await api.delete<ApiSingleResponse<BlogPostResponse>>(
    endpoints.blog.delete(id),
  );

  return data;
}

// ───────────────────────── بخش‌های مقاله (بلوک‌ها) ─────────────────────────

export async function adminBlogBlocks(id: number) {
  const { data } = await api.get<ApiListResponse<BlogBlock>>(
    endpoints.blog.blocks(id),
  );

  return data;
}

/** ترتیب آرایه = ترتیب نمایش بخش‌ها در مقاله */
export async function saveBlogBlocks(id: number, blocks: BlogBlock[]) {
  const { data } = await api.put<ApiListResponse<BlogBlock>>(
    endpoints.blog.blocks(id),
    { blocks },
  );

  return data;
}

export interface UploadedMedia {
  /** مسیر نسبی که در دیتابیس ذخیره می‌شود (مثل videos/x.mp4) */
  url: string;
  filename: string;
  kind: 'image' | 'video' | 'audio';
}

/**
 * آپلود فایل از سیستم ادمین.
 *
 * برای ویدیو تا ۵۰ مگابایت و تصویر تا ۵ مگابایت مجاز است (سقف بک‌اند).
 */
export async function uploadBlogMedia(
  file: File,
  kind: 'image' | 'video',
  onProgress?: (percent: number) => void,
): Promise<UploadedMedia> {
  const formData = new FormData();

  const field = kind === 'video' ? 'videos' : 'images';
  formData.append(field, file);

  const { data } = await api.post<
    ApiSingleResponse<{
      url: string;
      filename: string;
      files: UploadedMedia[];
    }>
  >(endpoints.files[kind], formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: event => {
      if (!onProgress || !event.total) return;
      onProgress(Math.round((event.loaded * 100) / event.total));
    },
  });

  const payload = data.data;

  return {
    url: payload.files?.[0]?.url ?? payload.url,
    filename: payload.files?.[0]?.filename ?? payload.filename,
    kind,
  };
}
