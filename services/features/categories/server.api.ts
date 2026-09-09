import { serverFetch } from '@/services/api/server';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { CategoriesResponse } from './types';

export async function getCategories() {
  return serverFetch<ApiListResponse<CategoriesResponse>>('categories', {
    next: { revalidate: 3600, tags: ['categories'] },
  });
}

export async function getAllCategories() {
  return serverFetch<ApiListResponse<CategoriesResponse>>(
    'categories?all=true',
    {
      next: { revalidate: 3600, tags: ['categories'] },
    },
  );
}

export async function getHeroSectionCategories() {
  return serverFetch<ApiListResponse<CategoriesResponse>>(
    'categories?isInHeroSection=true',
    {
      next: { revalidate: 3600, tags: ['home-hero-categories'] },
    },
  );
}

export async function getHomeCategories() {
  return serverFetch<ApiListResponse<CategoriesResponse>>(
    'categories?isInHome=true',
    {
      next: { revalidate: 3600, tags: ['home-categories'] },
    },
  );
}

export async function getCategoryBySlug(slug: string) {
  const response = await serverFetch<ApiSingleResponse<CategoriesResponse>>(
    `categories/slug/${slug}`,
    {
      next: { revalidate: 600, tags: [`category-${slug}`] },
    },
  );
  return response;
}
