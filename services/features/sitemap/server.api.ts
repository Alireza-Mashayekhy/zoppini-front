import { serverFetch } from '@/services/api/server';
import { ApiSingleResponse } from '@/services/api/types';

export async function getSitemap() {
  return serverFetch<
    ApiSingleResponse<{ products: any[]; categories: any[]; blogPosts: any[] }>
  >('sitemap');
}
