// app/product/[productSlug]/page.tsx
import { Metadata } from 'next';

import ProductContent from '@/components/pages/product/content';
import { getProduct } from '@/services/features/products/server.api';

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
        title: 'محصول یافت نشد | زوپینی',
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
      title: `${productData.title} | زوپینی`,
      description: cleanDescription,
      keywords: productData.title?.split(' ').slice(0, 5).join(', ') || '',
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
        canonical: `/product/${productData.slug}`,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      title: 'محصول یافت نشد | زوپینی',
      description: 'محصول مورد نظر شما یافت نشد.',
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productSlug } = await params;
  const product = await getProduct(productSlug);
  const productData = product.data;

  return <ProductContent products={productData} />;
}
