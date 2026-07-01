import { notFound } from 'next/navigation';

import BlogContent from '@/components/pages/blog/blog-content';
import { getBlogPost } from '@/services/features/blog/server.api';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
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
