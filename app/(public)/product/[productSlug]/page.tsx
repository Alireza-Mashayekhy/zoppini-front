// app/product/[productSlug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ProductContent from '@/components/pages/product/content';
import ProductJsonLd from '@/components/pages/product/product-jsonld';
import Breadcrumb from '@/components/shared/breadcrumb';
import { applyRobotsDirective, mergePageSeo } from '@/lib/seo';
import { ApiError } from '@/services/api/server';
import {
  getProduct,
  getProductGuides,
} from '@/services/features/products/server.api';
import { getPageSeo } from '@/services/features/seo/server.api';
interface ProductPageProps {
  params: Promise<{ productSlug: string }>;
}

/**
 * متای نهایی صفحه‌ی محصول:
 * متای تولیدشده از اطلاعات محصول + دستور robots ثبت‌شده در فرم خود محصول
 * (ایندکس/فالو) + اورراید پنل سئو برای مسیر `/product/{slug}` که بر همه
 * اولویت دارد.
 */
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { productSlug } = await params;

  const metadata = await buildProductMetadata(productSlug);

  const seo = await getPageSeo(`/product/${productSlug}`);

  return mergePageSeo(metadata, seo);
}

// تولید متا دیتا بر اساس اطلاعات محصول
async function buildProductMetadata(productSlug: string): Promise<Metadata> {
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

    // متای ثبت‌شده در پنل محصول، بر متن تولیدشده اولویت دارد
    const metaTitle =
      productData.metaTitle?.trim() || `${productData.title} - زوپینی`;
    const metaDescription =
      productData.metaDescription?.trim() || cleanDescription;

    // اولین تصویر محصول (اگر وجود داشته باشد)
    const imageUrl = productData.image
      ? `${process.env.NEXT_PUBLIC_IMAGE_URL || ''}${productData.image}`
      : undefined;

    const metadata: Metadata = {
      title: metaTitle,
      description: metaDescription,
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        images: imageUrl ? [{ url: imageUrl }] : [],
        type: 'website',
        siteName: 'زوپینی',
        locale: 'fa_IR',
      },
      twitter: {
        card: 'summary_large_image',
        title: metaTitle,
        description: metaDescription,
        images: imageUrl ? [imageUrl] : [],
      },
      alternates: {
        canonical: `https://zoppinico.com/product/${productData.slug}`,
      },
    };

    // دستور robots ثبت‌شده در فرم خود محصول (پنل محصولات)
    return applyRobotsDirective(metadata, {
      indexable: productData.indexable,
      followable: productData.followable,
    });
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
