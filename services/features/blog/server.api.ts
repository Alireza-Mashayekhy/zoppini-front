import { cache } from 'react';

import { publicFetch } from '@/services/api/server';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { BlogPostResponse } from './types';

/**
 * جداسازیِ داده‌ی عمومی از داده‌ی شخصی (تشخیصِ هدر
 * `Cache-Control: private, no-cache, no-store` روی HTML):
 *
 * اندپوینت‌های این فایل در بک‌اند هیچ Guard یا احراز هویتی ندارند و پاسخ‌شان
 * به کاربر وابسته نیست؛ بنابراین با `publicFetch` خوانده می‌شوند: نه کوکیِ
 * کاربر فرستاده می‌شود و نه `cookies()` فراخوانی می‌شود. سیاستِ کش این
 * فراخوانی‌ها تغییر نکرده است.
 *
 * توجه: `publicFetch` مسیر را ایستا نمی‌کند — پیش‌فرضِ آن `cache: 'no-store'`
 * است و مسیر در هر درخواست دوباره رندر می‌شود. سودِ این جداسازی آن است که
 * هیچ داده‌ی وابسته به نشست وارد این درخواست‌ها نمی‌شود (و مسیر به‌خاطرِ
 * `cookies()` داینامیک نمی‌ماند)، نه اینکه خروجی کش شود.
 *
 * فراخوانی‌هایی که `next: { revalidate }` دارند (مثل featured/style) عمداً روی
 * `serverFetch` مانده‌اند؛ فعال کردنِ کش برای آن‌ها یعنی ISR و چون روی تازگیِ
 * قیمت/موجودی اثر دارد، نیازمند تصمیم جداگانه است (در گزارش مستند شده).
 */

interface GetBlogPostsParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  isFeatured?: boolean;
}

/**
 * فراخوانیِ واقعیِ API، با `cache()` پوشش داده شده.
 *
 * دلیل: `getBlogPosts` هم در `generateMetadata` (برای تشخیصِ تعداد صفحات،
 * canonical و عنوان) و هم در بدنه‌ی صفحه صدا زده می‌شود. کلیدِ این حافظه
 * **رشته‌ی URL** است (نه آبجکت) تا مقدارِ یکسان واقعاً یکی شود؛ در غیر این
 * صورت هر درخواست دو فراخوانیِ مشابه به بک‌اند می‌فرستاد. این فقط حافظه‌ی
 * درونِ یک رندر است و سیاستِ کش را تغییر نمی‌دهد (همان `publicFetch`).
 */
const fetchBlogPosts = cache((url: string) =>
  publicFetch<ApiListResponse<BlogPostResponse>>(url),
);

export async function getBlogPosts(params: GetBlogPostsParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append('page', String(params.page));
  if (params.limit) searchParams.append('limit', String(params.limit));
  if (params.search) searchParams.append('search', params.search);
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.isFeatured !== undefined) {
    searchParams.append('isFeatured', String(params.isFeatured));
  }

  return fetchBlogPosts(`blog?${searchParams.toString()}`);
}

export async function getFeaturedBlogPosts() {
  return publicFetch<ApiListResponse<BlogPostResponse>>(
    'blog?isFeatured=true&all=true',
  );
}

export async function getBlogPost(slug: string) {
  return publicFetch<ApiSingleResponse<BlogPostResponse>>(
    `blog/slug/${slug}`,
  );
}
