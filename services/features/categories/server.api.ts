import { serverFetch } from '@/services/api/server';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { CategoriesResponse } from './types';

export async function getCategories() {
  return serverFetch<ApiListResponse<CategoriesResponse>>('categories');
}

export async function getAllCategories() {
  return serverFetch<ApiListResponse<CategoriesResponse>>(
    'categories?all=true',
  );
}

export async function getHeroSectionCategories() {
  return serverFetch<ApiListResponse<CategoriesResponse>>(
    'categories?isInHeroSection=true',
  );
}

export async function getHomeCategories() {
  return serverFetch<ApiListResponse<CategoriesResponse>>(
    'categories?isInHome=true',
  );
}

export async function getCategoryBySlug(slug: string) {
  const response = await serverFetch<ApiSingleResponse<CategoriesResponse>>(
    `categories/slug/${slug}`,
  );
  return response;
}
