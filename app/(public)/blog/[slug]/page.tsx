/* eslint-disable react-hooks/error-boundaries */
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import BlogContent from '@/components/pages/blog/blog-content';
import { applyRobotsDirective, mergePageSeo } from '@/lib/seo';
import { getBlogPost } from '@/services/features/blog/server.api';
import { getPageSeo } from '@/services/features/seo/server.api';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * متای نهایی صفحه‌ی مقاله:
 * متای تولیدشده از اطلاعات مقاله + دستور robots ثبت‌شده در فرم خود مقاله
 * (ایندکس/فالو) + اورراید پنل سئو برای مسیر `/blog/{slug}` که بر همه
 * اولویت دارد.
 */
export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  const metadata = await buildBlogMetadata(slug);

  const seo = await getPageSeo(`/blog/${slug}`);

  return mergePageSeo(metadata, seo);
}

async function buildBlogMetadata(slug: string): Promise<Metadata> {
  try {
    const post = await getBlogPost(slug);
    const data = post.data;

    if (!data) {
      return {
        title: 'پست یافت نشد | زوپینی',
        description: 'پست مورد نظر یافت نشد.',
      };
    }

    const cleanDescription = data.excerpt
      ? data.excerpt.replace(/<[^>]+>/g, '').slice(0, 160)
      : `مطالعه مقاله ${data.title} در وبلاگ زوپینی`;

    // متای ثبت‌شده در پنل بلاگ، بر متن تولیدشده اولویت دارد
    const metaTitle = data.metaTitle?.trim() || `${data.title} | وبلاگ زوپینی`;
    const metaDescription = data.metaDescription?.trim() || cleanDescription;

    const imageUrl = data.coverImage
      ? `${process.env.NEXT_PUBLIC_IMAGE_URL || ''}${data.coverImage}`
      : undefined;

    const metadata: Metadata = {
      title: metaTitle,
      description: metaDescription,
      keywords: data.title?.split(' ').slice(0, 5).join(', ') || '',
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        images: imageUrl ? [{ url: imageUrl }] : [],
        type: 'article',
        siteName: 'زوپینی',
        locale: 'fa_IR',
        publishedTime: data.publishedAt || data.createdAt,
        modifiedTime: data.updatedAt,
        authors: ['نویسنده'],
      },
      twitter: {
        card: 'summary_large_image',
        title: metaTitle,
        description: metaDescription,
        images: imageUrl ? [imageUrl] : [],
      },
      alternates: {
        canonical: `https://zoppinico.com/blog/${data.slug}`,
      },
    };

    // دستور robots ثبت‌شده در فرم خود مقاله (پنل بلاگ)
    return applyRobotsDirective(metadata, {
      indexable: data.indexable,
      followable: data.followable,
    });
  } catch {
    return {
      title: 'پست یافت نشد | زوپینی',
      description: 'پست مورد نظر یافت نشد.',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  try {
    const post = await getBlogPost(slug);
    return (
      <div className="pt-[52px]">
        <BlogContent post={post.data} />
      </div>
    );
  } catch {
    notFound();
  }
}
