import { cache } from 'react';

import { categorySlugSegment } from '@/lib/category-slug';
import { ApiError, serverFetch } from '@/services/api/server';
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
    `categories/slug/${categorySlugSegment(slug)}`,
    {
      next: { revalidate: 600, tags: [`category-${slug}`] },
    },
  );
  return response;
}

/** Share the same public-category lookup between metadata and page rendering. */
export const getPublicCategoryBySlug = cache(async (slug: string) => {
  try {
    const response = await getCategoryBySlug(slug);
    return response.data?.isActive ? response : null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    // Backend outages must remain errors, not cached "category not found" pages.
    throw error;
  }
});
