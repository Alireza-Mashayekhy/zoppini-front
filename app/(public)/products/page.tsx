// app/products/page.tsx
import { Metadata } from 'next';

import ProductList from '@/components/pages/products/product-list';
import { parseProductPriceRange } from '@/lib/product-list-params';
import { DEFAULT_PRODUCT_SORT } from '@/lib/product-sort';
import { buildPageMetadata } from '@/lib/seo';
import {
  getCategoryFilters,
  getProducts,
} from '@/services/features/products/server.api';

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    categoryIds?: string;
    colorIds?: string;
    sizeIds?: string;
    priceMin?: string;
    priceMax?: string;
  }>;
}

const pageMetadata: Metadata = {
  title: 'همه محصولات - زوپینی',
  description:
    'خرید انواع کت شلوار مردانه، کت تک، پالتو، پیراهن و شلوار از زوپینی',
  alternates: { canonical: 'https://zoppinico.com/products' },
};

/**
 * متای این صفحه: اگر مدیر سئو در پنل مقداری ثبت کرده باشد، همان مقدار
 * جایگزین متادیتای پیش‌فرض بالا می‌شود.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/products', pageMetadata);
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;

  const priceRange = parseProductPriceRange(params.priceMin, params.priceMax);

  const queryParams = {
    page: params.page ? Number(params.page) : 1,
    limit: params.limit ? Number(params.limit) : 10,
    search: params.search || '',
    // پیش‌فرض «جدیدترین»؛ همان چیزی که در منوی مرتب‌سازی انتخاب‌شده است
    sort: params.sort || DEFAULT_PRODUCT_SORT,
    categoryIds:
      params.categoryIds?.split(',').map(Number).filter(Boolean) || [],
    colorIds: params.colorIds?.split(',').map(Number).filter(Boolean) || [],
    sizeIds: params.sizeIds?.split(',').map(Number).filter(Boolean) || [],
    ...priceRange,
  };

  const [productsData, filterOptions] = await Promise.all([
    getProducts(queryParams),
    // بدون categoryIds یعنی اجتماع رنگ‌ها/سایزهای همهٔ محصولات + بازهٔ قیمت
    getCategoryFilters(),
  ]);

  return (
    <div className="pt-[52px]">
      {/* عنوان صفحه بدون نمایش شماره‌ی محصولات */}
      <h1 className="h-20 border-t px-6 flex items-center">همه محصولات</h1>
      <ProductList
        initialData={productsData}
        initialParams={queryParams}
        filterColors={filterOptions.colors}
        filterSizes={filterOptions.sizes}
        filterMinPrice={filterOptions.minPrice}
        filterMaxPrice={filterOptions.maxPrice}
      />
    </div>
  );
}
