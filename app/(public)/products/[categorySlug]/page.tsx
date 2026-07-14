// app/products/[categorySlug]/page.tsx
import { Metadata } from 'next';

import ProductList from '@/components/pages/products/product-list';
import { getCategoryBySlug } from '@/services/features/categories/server.api';
import { getProducts } from '@/services/features/products/server.api';

interface ProductsCategoryPageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    colorIds?: string;
    sizeIds?: string;
  }>;
}

// تولید متا دیتا بر اساس اطلاعات دسته‌بندی
export async function generateMetadata({
  params,
}: ProductsCategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;

  try {
    const category = await getCategoryBySlug(categorySlug);
    const categoryData = category?.data;

    if (!categoryData) {
      return {
        title: 'دسته‌بندی یافت نشد - زوپینی',
        description: 'دسته‌بندی مورد نظر شما یافت نشد.',
      };
    }

    // حذف تگ‌های HTML از توضیحات (اگر داشته باشد)
    const cleanDescription = categoryData.description
      ? categoryData.description.replace(/<[^>]+>/g, '').slice(0, 160)
      : `مشاهده محصولات دسته ${categoryData.name} در زوپینی`;

    const imageUrl = categoryData.image
      ? `${process.env.NEXT_PUBLIC_IMAGE_URL || ''}${categoryData.image}`
      : undefined;

    return {
      title: `قیمت و خرید انواع ${categoryData.name} - زوپینی`,
      description: cleanDescription,
      keywords: `خرید ${categoryData.name}, محصولات ${categoryData.name}, ${categoryData.name} مردانه, زوپینی`,
      openGraph: {
        title: categoryData.name,
        description: cleanDescription,
        images: imageUrl ? [{ url: imageUrl }] : [],
        type: 'website',
        siteName: 'زوپینی',
        locale: 'fa_IR',
      },
      twitter: {
        card: 'summary_large_image',
        title: categoryData.name,
        description: cleanDescription,
        images: imageUrl ? [imageUrl] : [],
      },
      alternates: {
        canonical: `/products/${categoryData.slug}`,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      title: 'دسته‌بندی یافت نشد | زوپینی',
      description: 'دسته‌بندی مورد نظر شما یافت نشد.',
    };
  }
}

export default async function ProductsCategoryPage({
  params,
  searchParams,
}: ProductsCategoryPageProps) {
  const { categorySlug } = await params;
  const search = await searchParams;

  // ۱. دریافت اطلاعات دسته‌بندی
  const category = await getCategoryBySlug(categorySlug);

  // ۲. ساخت پارامترهای query برای دریافت محصولات
  const queryParams = {
    page: search.page ? Number(search.page) : 1,
    limit: search.limit ? Number(search.limit) : 10,
    search: search.search || '',
    sort: search.sort || '',
    categoryIds: category?.data ? [category?.data.id] : [],
    colorIds: search.colorIds?.split(',').map(Number).filter(Boolean) || [],
    sizeIds: search.sizeIds?.split(',').map(Number).filter(Boolean) || [],
  };

  // ۳. دریافت محصولات
  const productsData = await getProducts(queryParams);

  return (
    <div className="pt-[52px]">
      {/* هدر با نام دسته‌بندی */}
      <h1 className="h-20 border-t px-6 flex items-center text-xl font-semibold">
        {category?.data?.name || 'دسته‌بندی'}
        <span className="mr-2 text-sm text-gray-500 font-normal">
          ({productsData?.pagination?.total || 0} محصول)
        </span>
      </h1>

      <ProductList initialData={productsData} initialParams={queryParams} />
    </div>
  );
}
