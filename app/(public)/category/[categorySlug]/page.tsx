import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';

import CategoryLanding from '@/components/pages/category/category-landing';
import { cleanCategoryDescription } from '@/lib/category-description';
import { activeCategoryChildren } from '@/lib/category-landing';
import { categorySlugSegment } from '@/lib/category-slug';
import { meaningfulDescription, mergePageSeo } from '@/lib/seo';
import {
  getAllCategories,
  getPublicCategoryBySlug,
} from '@/services/features/categories/server.api';
import { getProducts } from '@/services/features/products/server.api';
import { getPageSeo } from '@/services/features/seo/server.api';
import { cleanCategoryDescription } from '@/lib/category-description';

type Props = { params: Promise<{ categorySlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = (await getPublicCategoryBySlug(categorySlug))?.data;
  if (!category)
    return { title: 'دسته‌بندی یافت نشد - زوپینی', robots: { index: false } };

  const text = sanitizeHtml(category.description || '', {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
  const title = `قیمت و خرید انواع ${category.name} - زوپینی`;
  // توضیحاتِ بی‌محتوا (مثل یک نقطه) نادیده گرفته می‌شود.
  const description = meaningfulDescription(
    text,
    `مشاهده محصولات دسته ${category.name} در زوپینی`,
  );
  const url = `https://zoppinico.com/category/${categorySlugSegment(category.slug)}`;
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
  /**
   * سیاستِ آدرس‌های دسته‌بندی (مستندسازیِ تصمیم موجود؛ تغییر داده نشده است):
   *
   * - `/product-category/{slug}` → آدرسِ اصلی و ایندکس‌شونده‌ی لیست محصولات
   *   (همان که در `product-category-sitemap.xml` هم هست).
   * - `/category/{slug}` → صفحه‌ی معرفی/لندینگِ دسته که فقط وقتی دسته
   *   زیردسته دارد نمایش داده می‌شود و در غیر این صورت با `redirect` به
   *   `/product-category/{slug}` می‌رود. این صفحه محتوای تکراریِ زیادی با
   *   صفحه‌ی اصلیِ دسته دارد، برای همین `noindex, follow` است: ایندکس نمی‌شود
   *   اما لینک‌های آن (به زیردسته‌ها و محصولات) دنبال می‌شوند تا ارزش منتقل
   *   شود و خزش هدر نرود.
   *
   * چرا `noindex` اینجا «حذف نشد»؟ چون /category/* یک صفحه‌ی معرفی با محتوای
   * عمدتاً تکراری است و ایندکس کردنِ آن ریسکِ رقابت با /product-category/*
   * (کَنیبالیزیشن/ duplicate content) دارد. تغییر این سیاست یک تصمیمِ سئوی
   * محتوایی است و نیازمند تأیید جداگانه است.
   *
   * نکته‌ی مهم: چون این صفحه `noindex` است اما در robots.txt مسدود نیست،
   * خزنده آن را می‌خزد و متا را می‌خواند؛ ترکیبِ Disallow و noindex روی این
   * مسیر عمداً انجام نشده است تا noindex واقعاً دیده شود.
   *
   * هیچ ریدایرکت جدیدی بین این دو الگوی آدرس اضافه نشده و تنظیمات Nginx
   * (در صورت وجود) دست‌نخورده باقی مانده است.
   */
  return {
    ...metadata,
    robots: { index: false, follow: seo?.followable !== false },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const category = (await getPublicCategoryBySlug(categorySlug))?.data;
  if (!category) notFound();
  const categoriesResponse = await getAllCategories();
  const categories = categoriesResponse.data;
  // The public API returns active categories. It has no merchandising order;
  // id order is an explicit, stable fallback based on the existing site data.
  const children = activeCategoryChildren(categories, category.id);
  if (!children.length)
    redirect(`/product-category/${categorySlugSegment(category.slug)}`);

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
