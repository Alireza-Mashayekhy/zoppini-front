// app/product/[productSlug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ProductContent from '@/components/pages/product/content';
import ProductJsonLd from '@/components/pages/product/product-jsonld';
import Breadcrumb from '@/components/shared/breadcrumb';
import { ApiError } from '@/services/api/server';
import {
  getProduct,
  getProductGuides,
} from '@/services/features/products/server.api';
interface ProductPageProps {
  params: Promise<{ productSlug: string }>;
}

// تولید متا دیتا بر اساس اطلاعات محصول
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { productSlug } = await params;

  try {
    const product = await getProduct(productSlug);
    const productData = product.data.product;

    if (!productData) {
      return {
        title: 'محصول یافت نشد - زوپینی',
        description: 'محصول مورد نظر شما یافت نشد.',
      };
    }

    // حذف تگ‌های HTML از توضیحات برای متا دیتا
    const cleanDescription = productData.description
      ? productData.description.replace(/<[^>]+>/g, '').slice(0, 160)
      : `خرید ${productData.title} از زوپینی`;

    // اولین تصویر محصول (اگر وجود داشته باشد)
    const imageUrl = productData.image
      ? `${process.env.NEXT_PUBLIC_IMAGE_URL || ''}${productData.image}`
      : undefined;

    return {
      title: `${productData.title} - زوپینی`,
      description: cleanDescription,
      openGraph: {
        title: productData.title,
        description: cleanDescription,
        images: imageUrl ? [{ url: imageUrl }] : [],
        type: 'website',
        siteName: 'زوپینی',
        locale: 'fa_IR',
      },
      twitter: {
        card: 'summary_large_image',
        title: productData.title,
        description: cleanDescription,
        images: imageUrl ? [imageUrl] : [],
      },
      alternates: {
        canonical: `https://zoppinico.com/product/${productData.slug}`,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      title: 'محصول یافت نشد - زوپینی',
      description: 'محصول مورد نظر شما یافت نشد.',
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productSlug } = await params;
  let product;

  try {
    product = await getProduct(productSlug);
  } catch (error) {
    console.error('Product error:', error);

    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  const productData = product.data;

  const guides = await getProductGuides(productData.product.slug);

  return (
    <>
      <ProductJsonLd product={productData.product} />
      <Breadcrumb
        items={[
          { name: 'خانه', href: '/' },
          {
            name: productData.product.categories[0].name,
            href: `/product-category/${productData.product.categories[0].slug}`,
          },
          {
            name: productData.product.title,
            href: `/product/${productData.product.slug}`,
          },
        ]}
      />
      <ProductContent products={productData} guides={guides?.data ?? null} />
    </>
  );
}
