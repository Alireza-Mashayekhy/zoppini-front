// app/products/page.tsx
import { Metadata } from 'next';

import ProductList from '@/components/pages/products/product-list';
import { buildPageMetadata } from '@/lib/seo';
import { getProducts } from '@/services/features/products/server.api';

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    categoryIds?: string;
    colorIds?: string;
    sizeIds?: string;
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

  const queryParams = {
    page: params.page ? Number(params.page) : 1,
    limit: params.limit ? Number(params.limit) : 10,
    search: params.search || '',
    sort: params.sort || '',
    categoryIds:
      params.categoryIds?.split(',').map(Number).filter(Boolean) || [],
    colorIds: params.colorIds?.split(',').map(Number).filter(Boolean) || [],
    sizeIds: params.sizeIds?.split(',').map(Number).filter(Boolean) || [],
  };

  const productsData = await getProducts(queryParams);

  return (
    <div className="pt-[52px]">
      <h1 className="h-20 border-t px-6 flex items-center">
        همه محصولات{' '}
        <span className="mr-2 text-sm text-gray-500 font-normal">
          ({productsData?.pagination?.total || 0} محصول)
        </span>
      </h1>
      <ProductList initialData={productsData} initialParams={queryParams} />
    </div>
  );
}
