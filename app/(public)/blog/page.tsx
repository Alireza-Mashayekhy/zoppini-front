import { Metadata } from 'next';
import { Suspense } from 'react';

import BlogList from '@/components/pages/blog/blog-list';
import {
  BLOG_PAGE_SIZE,
  BLOG_TITLE,
  blogPageTitle,
  buildBlogPageSeo,
  parsePageParam,
  resolveBlogRobots,
} from '@/lib/blog-pagination';
import { mergePageSeo } from '@/lib/seo';
import { getBlogPosts } from '@/services/features/blog/server.api';
import { getPageSeo } from '@/services/features/seo/server.api';

interface BlogPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

/**
 * متادیتای پیش‌فرضِ وبلاگ.
 *
 * عنوان و canonical در هر صفحه بر اساس سیاستِ صفحه‌بندی ساخته می‌شوند
 * (`lib/blog-pagination.ts`)، پس اینجا فقط توضیح می‌آید.
 */
const pageMetadata: Metadata = {
  description:
    'مقالات و راهنمای استایل مردانه زوپینی؛ از انتخاب و ست‌کردن کت‌وشلوار و پیراهن تا نگهداری لباس و انتخاب اکسسوری.',
};

/**
 * متای این صفحه.
 *
 * - عنوان و توضیح: اگر مدیر سئو در پنل مقداری ثبت کرده باشد همان جایگزینِ
 *   مقدارِ پیش‌فرض می‌شود؛ عنوانِ صفحاتِ ۲ به بعد پسوندِ شماره می‌گیرد تا
 *   عنوان‌ها یکتا بمانند.
 * - canonical و robots: همیشه از سیاستِ صفحه‌بندی می‌آیند، با این استثنا که
 *   پنل می‌تواند ایندکس/دنبال‌کردن را خاموش کند (اما نمی‌تواند وضعیتِ
 *   نامعتبر را ایندکس‌پذیر کند).
 */
export async function generateMetadata({
  searchParams,
}: BlogPageProps): Promise<Metadata> {
  const params = await searchParams;

  const [list, seo] = await Promise.all([
    getBlogPosts({
      // مقدارِ نامعتبر (صفر، منفی، غیرعددی) هیچ‌وقت به بک‌اند فرستاده
      // نمی‌شود؛ در آن صورت صفحه‌ی اول نمایش داده می‌شود و چون وضعیت
      // نامعتبر است، `noindex` می‌گیرد.
      page: parsePageParam(params.page) ?? 1,
      search: params.search,
      limit: BLOG_PAGE_SIZE,
    }),
    getPageSeo('/blog'),
  ]);

  const pageSeo = buildBlogPageSeo({
    page: params.page,
    search: params.search,
    totalPages: list?.pagination?.totalPages ?? 1,
  });

  const merged = mergePageSeo(
    {
      ...pageMetadata,
      title: BLOG_TITLE,
      alternates: { canonical: pageSeo.canonical },
    },
    seo,
  );

  // عنوانِ صفحه‌ی اول (پیش‌فرض یا مقدارِ پنل) مبنای عنوانِ صفحاتِ بعدی است.
  const baseTitle =
    typeof merged.title === 'string' && merged.title.trim()
      ? merged.title.trim()
      : BLOG_TITLE;

  // وضعیتِ نامعتبر (پارامترِ خراب یا صفحه‌ی خارج از محدوده) همان محتوای
  // صفحه‌ی اول را نشان می‌دهد و canonical هم به صفحه‌ی اول است؛ پس عنوان هم
  // باید همان عنوانِ صفحه‌ی اول باشد.
  const titlePage = pageSeo.isValidPage ? pageSeo.requestedPage : 1;

  return {
    ...merged,
    title: blogPageTitle(titlePage, baseTitle),
    alternates: { canonical: pageSeo.canonical },
    robots: resolveBlogRobots(seo, pageSeo.robots),
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const queryParams = {
    page: parsePageParam(params.page) ?? 1,
    search: params.search,
    limit: BLOG_PAGE_SIZE,
  };

  const blogData = await getBlogPosts(queryParams);

  return (
    <div className="pt-[52px] custom-container py-10">
      <h1 className="text-3xl font-light my-10">مقالات</h1>
      <Suspense>
        <BlogList initialData={blogData} initialParams={queryParams} />
      </Suspense>
    </div>
  );
}
