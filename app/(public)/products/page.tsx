// app/products/page.tsx
import ProductList from '@/components/pages/products/product-list';
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
