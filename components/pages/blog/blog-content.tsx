import Image from 'next/image';

import { BlogPostResponse } from '@/services/features/blog/types';

export default function BlogContent({ post }: { post: BlogPostResponse }) {
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('fa-IR')
    : null;

  return (
    <article className="custom-container pb-10">
      {post.coverImage && (
        <div className="relative w-full aspect-video mb-8 overflow-hidden">
          <Image
            src={process.env.NEXT_PUBLIC_IMAGE_URL + post.coverImage}
            fill
            alt={post.title}
            className="object-cover"
            priority
          />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-light">{post.title}</h1>
        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          {formattedDate && <span>{formattedDate}</span>}
          {post.author?.fullName && (
            <>
              <span>·</span>
              <span>{post.author.fullName}</span>
            </>
          )}
        </div>
        {post.excerpt && (
          <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
        )}
      </header>

      <div
        className="prose prose-neutral max-w-none rtl"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
