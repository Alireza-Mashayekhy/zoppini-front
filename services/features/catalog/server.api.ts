import { serverFetch } from '@/services/api/server';
import { ApiListResponse } from '@/services/api/types';

import { CatalogPageResponse } from './types';

export async function getCatalogPages() {
  return serverFetch<ApiListResponse<CatalogPageResponse>>('catalog/pages');
}
