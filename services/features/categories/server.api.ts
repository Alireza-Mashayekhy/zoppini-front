import { serverFetch } from '@/services/api/server';
import { ApiListResponse } from '@/services/api/types';

import { CategoriesResponse } from './types';

export async function getCategories() {
  return serverFetch<ApiListResponse<CategoriesResponse>>(
    'categories?isInHeroSection=true&isInHome=true',
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
