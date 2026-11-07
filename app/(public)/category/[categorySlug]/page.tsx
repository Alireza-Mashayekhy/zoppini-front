import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import sanitizeHtml from 'sanitize-html';

import CategoryLanding from '@/components/pages/category/category-landing';
import {
  activeCategoryChildren,
  cleanCategoryDescription,
} from '@/lib/category-landing';
import { mergePageSeo } from '@/lib/seo';
import { ApiError } from '@/services/api/server';
import {
  getAllCategories,
  getCategoryBySlug,
} from '@/services/features/categories/server.api';
import { getProducts } from '@/services/features/products/server.api';
import { getPageSeo } from '@/services/features/seo/server.api';

type Props = { params: Promise<{ categorySlug: string }> };

const getCategory = cache(async (slug: string) => {
  try {
    const result = await getCategoryBySlug(encodeURIComponent(slug));
    return result.data?.isActive ? result.data : null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategory(categorySlug);
  if (!category)
    return { title: 'دسته‌بندی یافت نشد - زوپینی', robots: { index: false } };

  const text = sanitizeHtml(category.description || '', {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
  const title = `قیمت و خرید انواع ${category.name} - زوپینی`;
  const description =
    text.slice(0, 160) || `مشاهده محصولات دسته ${category.name} در زوپینی`;
  const url = `https://zoppinico.com/category/${category.slug}`;
  const image = category.image
    ? `${process.env.NEXT_PUBLIC_IMAGE_URL || ''}${category.image}`
    : undefined;
  const seo = await getPageSeo(`/product-category/${category.slug}`);
  const metadata = mergePageSeo(
    {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        siteName: 'زوپینی',
        locale: 'fa_IR',
        ...(image ? { images: [image] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    },
    seo,
  );
  // This is an additional browsing page, not an unplanned replacement of the indexed listing.
  return {
    ...metadata,
    robots: { index: false, follow: seo?.followable !== false },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const [category, categoriesResponse] = await Promise.all([
    getCategory(categorySlug),
    getAllCategories(),
  ]);
  if (!category) notFound();
  const categories = categoriesResponse.data;
  // The public API returns active categories. It has no merchandising order;
  // id order is an explicit, stable fallback based on the existing site data.
  const children = activeCategoryChildren(categories, category.id);
  if (!children.length) redirect(`/product-category/${category.slug}`);

  const configuredLimit = Number(process.env.CATEGORY_LANDING_PRODUCT_LIMIT);
  const limit =
    Number.isInteger(configuredLimit) &&
    configuredLimit >= 1 &&
    configuredLimit <= 24
      ? configuredLimit
      : 6;
  const [direct, ...childProducts] = await Promise.all([
    getProducts({
      categoryIds: [category.id],
      directCategory: true,
      limit,
      sort: 'id:asc',
    }),
    ...children.map(child =>
      getProducts({ categoryIds: [child.id], limit, sort: 'id:asc' }),
    ),
  ]);

  const ancestors = [];
  const visited = new Set([category.id]);
  let parentId = category.parentId;
  while (parentId != null) {
    const parent = categories.find(item => item.id === Number(parentId));
    if (!parent || visited.has(parent.id)) break;
    visited.add(parent.id);
    ancestors.unshift(parent);
    parentId = parent.parentId;
  }

  return (
    <CategoryLanding
      category={category}
      ancestors={ancestors}
      subcategories={children.map((child, index) => ({
        ...child,
        products: childProducts[index].data,
      }))}
      directProducts={direct.data}
      seoHtml={cleanCategoryDescription(category.description)}
    />
  );
}
