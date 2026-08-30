// app/products/page.tsx
import { Metadata } from 'next';

import ProductList from '@/components/pages/products/product-list';
import { getDiscountedProducts } from '@/services/features/products/server.api';

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

export const metadata: Metadata = {
  title: 'محصولات تخفیف خورده - زوپینی',

  openGraph: {
    title: 'محصولات تخفیف خورده - زوپینی',
    images: [{ url: '/logo/og-image.jpg' }],
    type: 'website',
    siteName: 'زوپینی',
    locale: 'fa_IR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'محصولات تخفیف خورده - زوپینی',
  },
  alternates: {
    canonical: '/discounted-products',
  },
};

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

  const productsData = await getDiscountedProducts(queryParams);

  return (
    <div className="pt-[52px]">
      <h1 className="h-20 border-t px-6 flex items-center">
        محصولات تخفیف خورده
        <span className="mr-2 text-sm text-gray-500 font-normal">
          ({productsData?.pagination?.total || 0} محصول)
        </span>
      </h1>
      <ProductList initialData={productsData} initialParams={queryParams} />
    </div>
  );
}
