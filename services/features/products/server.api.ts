import { publicFetch, serverFetch } from '@/services/api/server';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { ProductGuidesForCustomer } from '../product-guides/type';
import {
  ColorResponse,
  FeaturedProductResponse,
  ProductResponse,
  ProductsResponse,
  SizeResponse,
} from './type';

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

interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  categoryIds?: number[];
  directCategory?: boolean;
  colorIds?: number[];
  sizeIds?: number[];
  priceMin?: number;
  priceMax?: number;
}

export async function getProducts(params: GetProductsParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append('page', String(params.page));
  if (params.limit) searchParams.append('limit', String(params.limit));
  if (params.search) searchParams.append('search', params.search);
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.categoryIds?.length) {
    searchParams.append('categoryIds', params.categoryIds.join(','));
  }
  if (params.directCategory) searchParams.append('directCategory', 'true');
  if (params.colorIds?.length) {
    searchParams.append('colorIds', params.colorIds.join(','));
  }
  if (params.sizeIds?.length) {
    searchParams.append('sizeIds', params.sizeIds.join(','));
  }
  if (params.priceMin !== undefined) {
    searchParams.append('priceMin', String(params.priceMin));
  }
  if (params.priceMax !== undefined) {
    searchParams.append('priceMax', String(params.priceMax));
  }

  const url = `products?${searchParams.toString()}`;
  return publicFetch<ApiListResponse<ProductsResponse>>(url);
}

export interface CategoryFiltersResponse {
  colors: ColorResponse[];
  sizes: SizeResponse[];
  /** کمترین/بیشترین قیمت واقعی در همین دامنه (صفر یعنی محدوده در دسترس نیست) */
  minPrice?: number;
  maxPrice?: number;
  priceRange?: { min: number; max: number };
}

/**
 * رنگ‌ها و سایزهای واقعاً موجود در یک دسته‌بندی (برای سایدبار فیلتر).
 *
 * به‌جای `useColorsList`/`useSizeList` (که همه‌ی رنگ‌ها و سایزهای سیستم را
 * می‌آوردند و سیستم‌های سایزبندی مختلف را مخلوط می‌کردند)، این تابع از
 * بک‌اند فقط گزینه‌هایی را می‌گیرد که واقعاً در variantهای محصولاتِ همان
 * دسته استفاده شده‌اند — مثلاً کفش ۴۰–۴۶ و کت‌وشلوار ۴۶–۵۸.
 */
export async function getCategoryFilters(
  categoryId?: number,
): Promise<CategoryFiltersResponse> {
  try {
    const query =
      categoryId !== undefined ? `?categoryIds=${categoryId}` : '';
    const body = await publicFetch<
      ApiSingleResponse<CategoryFiltersResponse> | CategoryFiltersResponse
    >(`products/filters${query}`);
    if ('data' in body && body.data) return body.data;
    return body as CategoryFiltersResponse;
  } catch {
    // اگر اندپوینت هنوز منتشر نشده باشد، لیست خالی برمی‌گردد تا صفحه کادر
    // سایز/رنگ را خالی نشان دهد (بهتر از شکستن کل صفحه).
    return { colors: [], sizes: [] };
  }
}

export async function getProduct(slug: string) {
  return publicFetch<ApiSingleResponse<ProductResponse>>(`products/${slug}`);
}

export async function getProductGuides(slug: string): Promise<{
  data: ProductGuidesForCustomer;
} | null> {
  try {
    return await publicFetch<ApiSingleResponse<ProductGuidesForCustomer>>(
      `product-guides/product-slug/${encodeURIComponent(slug)}`,
    );
  } catch {
    return null;
  }
}

export async function getFeaturedProducts() {
  return serverFetch<ApiListResponse<FeaturedProductResponse>>('featured', {
    next: { revalidate: 300, tags: ['featured-products'] },
  });
}

export async function getStyleProducts() {
  return serverFetch<ApiListResponse<FeaturedProductResponse>>('style', {
    next: { revalidate: 300, tags: ['style-products'] },
  });
}

export async function getDiscountedProducts(params: GetProductsParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append('page', String(params.page));
  if (params.limit) searchParams.append('limit', String(params.limit));
  if (params.search) searchParams.append('search', params.search);
  if (params.sort) searchParams.append('sort', params.sort);
  if (params.categoryIds?.length) {
    searchParams.append('categoryIds', params.categoryIds.join(','));
  }
  if (params.colorIds?.length) {
    searchParams.append('colorIds', params.colorIds.join(','));
  }
  if (params.sizeIds?.length) {
    searchParams.append('sizeIds', params.sizeIds.join(','));
  }
  if (params.priceMin !== undefined) {
    searchParams.append('priceMin', String(params.priceMin));
  }
  if (params.priceMax !== undefined) {
    searchParams.append('priceMax', String(params.priceMax));
  }

  const url = `products/discounted?${searchParams.toString()}`;
  return publicFetch<ApiListResponse<ProductsResponse>>(url);
}
