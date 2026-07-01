import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { BlogPostResponse } from './types';

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
