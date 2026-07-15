/* eslint-disable react-hooks/error-boundaries */
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import BlogContent from '@/components/pages/blog/blog-content';
import { getBlogPost } from '@/services/features/blog/server.api';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

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

    const imageUrl = data.coverImage
      ? `${process.env.NEXT_PUBLIC_IMAGE_URL || ''}${data.coverImage}`
      : undefined;

    return {
      title: `${data.title} | وبلاگ زوپینی`,
      description: cleanDescription,
      keywords: data.title?.split(' ').slice(0, 5).join(', ') || '',
      openGraph: {
        title: data.title,
        description: cleanDescription,
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
        title: data.title,
        description: cleanDescription,
        images: imageUrl ? [imageUrl] : [],
      },
      alternates: {
        canonical: `/blog/${data.slug}`,
      },
    };
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
