import { serverFetch } from '@/services/api/server';
import { ApiListResponse } from '@/services/api/types';

import { CategoriesResponse } from './types';

export async function getCategories() {
  return serverFetch<ApiListResponse<CategoriesResponse>>(
    'categories?isInHeroSection=true&isInHome=true',
  );
}
