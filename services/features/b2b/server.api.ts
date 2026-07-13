import { serverFetch } from '@/services/api/server';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { BlogPostResponse } from './types';

interface GetBlogPostsParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  isFeatured?: boolean;
}

export async function getBlogPosts(params: GetBlogPostsParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append('page', String(params.page));
  if (params.limit) searchParams.append('limit', String(params.limit));
  if (params.search) searchParams.append('search', params.search);
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.isFeatured !== undefined) {
    searchParams.append('isFeatured', String(params.isFeatured));
  }

  const url = `blog?${searchParams.toString()}`;
  return serverFetch<ApiListResponse<BlogPostResponse>>(url);
}

export async function getFeaturedBlogPosts() {
  return serverFetch<ApiListResponse<BlogPostResponse>>(
    'blog?isFeatured=true&all=true',
  );
}

export async function getBlogPost(slug: string) {
  return serverFetch<ApiSingleResponse<BlogPostResponse>>(
    `blog/slug/${slug}`,
  );
}
