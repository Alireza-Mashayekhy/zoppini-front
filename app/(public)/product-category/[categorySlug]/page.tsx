// app/products/[categorySlug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ProductList from '@/components/pages/products/product-list';
import CategoryDescription from '@/components/shared/category-description';
import CategoryViewTracker from '@/components/shared/category-view-tracker';
import {
  categorySlugSegment,
  normalizeCategorySlug,
} from '@/lib/category-slug';
import {
  productCategoryParams,
  ProductCategorySearchParams,
} from '@/lib/product-category-params';
import { mergePageSeo } from '@/lib/seo';
import { getPublicCategoryBySlug } from '@/services/features/categories/server.api';
import { getProducts } from '@/services/features/products/server.api';
import { getPageSeo } from '@/services/features/seo/server.api';

interface ProductsCategoryPageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<ProductCategorySearchParams>;
}

/**
 * متای نهایی صفحه‌ی دسته‌بندی:
 * متای تولیدشده از اطلاعات دسته‌بندی + دستور robots (index/noindex و
 * follow/nofollow) که مدیر سئو در پنل برای مسیر `/product-category/{slug}`
 * ثبت کرده.
 */
export async function generateMetadata({
  params,
}: ProductsCategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;

  const metadata = await buildCategoryMetadata(categorySlug);

  const seo = await getPageSeo(
    `/product-category/${normalizeCategorySlug(categorySlug)}`,
  );

  return mergePageSeo(metadata, seo);
}

// تولید متا دیتا بر اساس اطلاعات دسته‌بندی
async function buildCategoryMetadata(categorySlug: string): Promise<Metadata> {
  try {
    const category = await getPublicCategoryBySlug(categorySlug);
    const categoryData = category?.data;

    if (!categoryData) {
      return {
        title: 'دسته‌بندی یافت نشد - زوپینی',
        robots: { index: false, follow: false },
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
        canonical: `https://zoppinico.com/product-category/${categorySlugSegment(categoryData.slug)}`,
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
  const category = await getPublicCategoryBySlug(categorySlug);
  if (!category) notFound();

  // ۲. ساخت پارامترهای query برای دریافت محصولات
  const queryParams = productCategoryParams(search, category.data.id);

  // ۳. دریافت محصولات
  const productsData = await getProducts(queryParams);

  return (
    <div className="pt-[52px]">
      {category?.data?.id && <CategoryViewTracker id={category.data.id} />}
      {/* هدر با نام دسته‌بندی */}
      <h1 className="h-20 border-t px-6 flex items-center text-xl font-semibold">
        {category?.data?.name || 'دسته‌بندی'}
        <span className="mr-2 text-sm text-gray-500 font-normal">
          ({productsData?.pagination?.total || 0} محصول)
        </span>
      </h1>

      <ProductList initialData={productsData} initialParams={queryParams} />

      {/* توضیحات دسته‌بندی؛ همان متنی که در /category/[slug] هم نمایش داده می‌شود */}
      {category?.data && (
        <CategoryDescription
          name={category.data.name}
          html={category.data.description}
        />
      )}
    </div>
  );
}
